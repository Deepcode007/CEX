import BTree from "sorted-btree";
import type { Orders, Pricelevel, Side, Type, worker_reason_type } from "../types/types";
import { createClientPool, type RedisClientPoolType } from "redis";
import { env } from "../../../UpdateWorker/src/envParse";
import { BALANCES } from "../server";
import { UpdateToRedis } from "../helpers/redisProcessor";
import { dump } from "../redis/dumpRedisWorker";
import { sendToWorker } from "../redis/SendRedisWorker";
import { toWorker } from "../..";
import { updateWalletDB } from "../helpers/updateWallet";

export class OrderBook {
    public asset: string;

    private bids: BTree<number, Pricelevel>;
    private asks: BTree<number, Pricelevel>;
    private orderMap: Map<string, Orders>;
    private redis_dumper: RedisClientPoolType;

    static async a(redis_dumper:RedisClientPoolType, asset: string):Promise<void>{
        redis_dumper.on('error', (err) => console.error(`Redis DB Dump Client Error for ${asset} `, err));
        await redis_dumper.connect();
    }

    constructor(asset: string) {
        this.asset = asset;
        this.orderMap = new Map();

        // Bids: Sorted Descending (Highest price at the top)
        // BTree constructor: new BTree(entries, comparator, maxNodeSize)
        this.bids = new BTree(undefined, (a, b) => b - a, undefined);

        // Asks: Sorted Ascending (Lowest price at the top)
        // Default comparator is ascending, so we don't need to pass one
        this.asks = new BTree();

        // env of Update Worker
        this.redis_dumper = createClientPool({
            url: env?.REDIS_SERVER_URL
        });
        
        OrderBook.a(this.redis_dumper, this.asset);
        
    }

    // --- Core Operations ---

    public addOrder(order: Orders, side: Side) {
        // get balance of the user and lock it
        let saved = this.orderMap.get(order.id);
        if (!saved) {
            this.orderMap.set(order.id, order);
            saved = order;
            let price_bucket = this[side].get(order.price);
            if (!price_bucket) {
                let price = {
                    total_quantity: 0,
                    price: order.price,
                    orders: [],
                };
                this[saved.side].set(order.price, price);
                price_bucket = this[side].get(order.price);
            }
            price_bucket!.orders.push(order);
            price_bucket!.total_quantity += order.quantity;
        }
    }

    public cancelOrder(orderId: string, side: Side): { status: boolean, delta:number} | boolean {
        let order = this.orderMap.get(orderId);
        if (!order || order.status == "filled" || order.status == "cancelled") {
            return false;
        }

        let bucket = this[side].get(order.price);
        if (!bucket) return false;

        bucket.total_quantity -= (order.quantity - order.filled_quantity);
        
        const index = bucket.orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            bucket.orders.splice(index, 1);
            
        }
        else return false;

        order.status = "cancelled";

        // If the bucket is empty, delete from B-Tree
        if (bucket.orders.length === 0) {
            this[side].delete(order.price);
        }

        this.orderMap.set(orderId, order);
        let delta = 0;
        if (order.side == "asks")
        {
            // sell asset
            let walletIncoming = BALANCES.get(order.userId)![order.market]!
            walletIncoming.available += walletIncoming.locked;
            delta = walletIncoming.locked;
            walletIncoming.locked = 0;
        }
        else {
            // buy asset
            let walletIncomingUSD = BALANCES.get(order.userId)?.USD!;
            walletIncomingUSD.available += walletIncomingUSD?.locked;
            delta = walletIncomingUSD.locked;
            walletIncomingUSD.locked = 0;
            
        }

        return {status: true, delta};
    }

    public getDetails(orderId: string)
    {
        return this.orderMap.get(orderId);
    }

    // --- Getters for the Matching Engine ---
    
    // get depth
    public getDepth()
    {
        let bids: { price: number, total_quantity: number }[] = [];
        bids = this.bids.keysArray().map((x) => {
            let total_quantity = this.bids.get(x)!.total_quantity;
            return { price: x, total_quantity };
        })

        let asks: { price: number, total_quantity: number }[] = [];
        asks = this.asks.keysArray().map((x) => {
            let total_quantity = this.asks.get(x)!.total_quantity;
            return { price: x, total_quantity };
        })

        return { bids, asks };
    }

    // lowest price seller
    public getBestBid(): Pricelevel | undefined {
        const minSeller = this.bids.minKey();
        if (minSeller == undefined) return undefined;
        return this.bids.get(minSeller as number);
    }

    // highest price buyer
    public getBestAsk(): Pricelevel | undefined {
        const maxBuyer = this.asks.maxKey();

        if (maxBuyer == undefined) return undefined;
        return this.asks.get(maxBuyer as number);
    }

    public async processOrder(incoming: Orders, side: Side, type: Type) {
        // create new order in db
        sendToWorker(this.redis_dumper, {
            reason: "CREATE_ORDER" as worker_reason_type,
            userId: incoming.userId,
            id: incoming.id,
            asset: incoming.market,
            price: incoming.price,
            type: incoming.type,
            side: "taker",
            filled_quantity: 0,
            quantity: incoming.quantity,
            status: "open",
            createdAt: new Date()
        })
        
        let other_tree = this[side == "asks" ? "bids" : "asks"]

        const contraLevels = [...other_tree.entries()];
        for (const [key, value] of contraLevels) {
            if (incoming.filled_quantity == incoming.quantity) break;

            if (side == "bids") {
                if (key > incoming.price) break;
            } else {
                if (key < incoming.price) break;
            }

            if (!other_tree.has(key)) continue;

            await this.executeTrade(incoming, value);
        }

        if (incoming.status == "open")
        {
            if (!this[side].has(incoming.price))
            {
                this[side].set(incoming.price, {
                    price: incoming.price,
                    total_quantity: 0,
                    orders: []
                })
            }

            let myLevel = this[side].get(incoming.price);
            myLevel!.total_quantity += incoming.quantity - incoming.filled_quantity;
            myLevel!.orders.push(incoming);
        }
        else
        {
            this.orderMap.delete(incoming.id);
        }
    }

    private async executeTrade(incoming: Orders, makerLevel: Pricelevel) {

        // TODO:
        // what if bids and asks user is the same??
        let filled = 0;
        for(let order of makerLevel.orders)
        {
            if (incoming.filled_quantity == incoming.quantity)
            {
                incoming.status = "filled";
                break;
            }
            let req_qty = Math.min(incoming.quantity - incoming.filled_quantity, order.quantity - order.filled_quantity);
            
            // balance plus minus

            // USD
            let walletIncomingUSD = BALANCES.get(incoming.userId)?.USD!;
            let walletMakerUSD = BALANCES.get(order.userId)?.USD!;

            // other asset
            let walletIncoming = BALANCES.get(incoming.userId)![incoming.market]!
            let walletMaker = BALANCES.get(order.userId)![incoming.market]!

            if (order.side == "bids")
            {
                order.filled_quantity += req_qty;
                incoming.filled_quantity += req_qty;

                // USD
                walletMakerUSD.available += req_qty * order.price;
                walletIncomingUSD.locked -= req_qty * order.price;

                // Asset
                walletMaker.locked -= req_qty;
                walletIncoming.available += req_qty;

                // DB updates
                UpdateToRedis(this.redis_dumper, incoming, order, req_qty);
                makerLevel.total_quantity -= req_qty;
            }
            else if (order.side == "asks")
            {
                order.filled_quantity += req_qty;
                incoming.filled_quantity += req_qty;

                // USD
                walletMakerUSD.locked -= req_qty * order.price;
                walletIncomingUSD.available += req_qty * order.price;

                // Asset
                walletMaker.available += req_qty;
                walletIncoming.locked -= req_qty;

                // DB Updates
                UpdateToRedis(this.redis_dumper, incoming, order, req_qty);
                makerLevel.total_quantity -= req_qty;
            }

            if (order.filled_quantity == order.quantity)
            {
                filled++;
                order.status = "filled";
            }
        }

        if (incoming.filled_quantity === incoming.quantity) {
            incoming.status = "filled";
        }

        // now after for loop, remove the filled orders from the makerlevel
        for (let i = 0; i < filled; i++)
        {
            // remove the 1st element as it is processed first.
            makerLevel.orders.shift();
        }

        if (makerLevel.orders.length === 0 && makerLevel.total_quantity === 0) {
            if (incoming.side === "bids") {
                this.asks.delete(makerLevel.price);
            } else {
                this.bids.delete(makerLevel.price);
            }
        }
    }
}
