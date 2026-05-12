import BTree from "sorted-btree";
import type { Orders, Pricelevel, Side, Type } from "../types/types";
import { createClientPool, type RedisClientPoolType } from "redis";
import { env } from "../../../UpdateWorker/src/envParse";
import { dump } from "../helpers/dumpRedisWorker";

export class OrderBook {
    public asset: string;

    private bids: BTree<number, Pricelevel>;
    private asks: BTree<number, Pricelevel>;
    private orderMap: Map<string, Orders>;
    private redis_dumper: RedisClientPoolType;

    static async a(redis_dumper:RedisClientPoolType):Promise<void>{
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
        
        OrderBook.a(this.redis_dumper);
        
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
            }
            price_bucket!.orders.push(order);
            price_bucket!.total_quantity += order.quantity;
        }
    }

    public cancelOrder(orderId: string, side: Side): boolean {
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

        return this.orderMap.delete(orderId);
    }

    // --- Getters for the Matching Engine ---

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
        let other_tree = this[side == "asks" ? "bids" : "asks"]

        for (const [key, value] of other_tree.entries()) {
            if (incoming.filled_quantity == incoming.quantity) break;

            await this.executeTrade(incoming, value);
        }
    }

    private async executeTrade(incoming: Orders, makerLevel: Pricelevel) {

        let filled = [];
        for(let order of makerLevel.orders)
        {
            if (incoming.filled_quantity == incoming.quantity)
            {
                break;
            }
            let req_qty = Math.min(incoming.quantity - incoming.filled_quantity, order.quantity - order.filled_quantity);
            
            // balance plus minus

            // USD
            let walletIncomingUSD = // get from inmemory
            let walletMakerUSD = 

            // other asset
            let walletIncoming = 
            let walletMaker = 

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
                // increase maker's USD
                let a = dump(this.redis_dumper, order, req_qty * order.price, "USD", "maker");
                // decrease my USD
                let b = dump(this.redis_dumper, incoming, -req_qty * order.price, "USD", "taker");

                // decrease maker's asset
                let c = dump(this.redis_dumper, order, -req_qty, order.market, "maker");
                // increase my asset
                let d = dump(this.redis_dumper, incoming, req_qty, order.market, "taker");

                // Redis Updates
                // increase maker's USD available
                let a1 = // update inmemory
                // decrease my USD locked
                let b1 = 
                // decrease maker's asset locked
                let c1 = 
                // increase my asset availavle
                let d1 = 
                

                await Promise.all([a, b, c, d, a1, b1, c1, d1]);
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
                // decrease maker's USD
                let a = dump(this.redis_dumper, order, -req_qty * order.price, "USD", "maker");
                // increase my USD
                let b = dump(this.redis_dumper, incoming, req_qty * order.price, "USD", "taker");

                // increase maker's asset
                let c = dump(this.redis_dumper, order, req_qty, order.market, "maker");
                // decrease my asset
                let d = dump(this.redis_dumper, incoming, -req_qty, order.market, "taker");

                // Redis Updates
                // decrease maker's USD locked
                let a1 = 
                // increase my USD available
                let b1 = 
                // increase maker's asset available
                let c1 = 
                // decrease my asset locked
                let d1 = 
                
                await Promise.all([a, b, c, d, a1, b1, c1, d1]);
                makerLevel.total_quantity -= req_qty;
            }

            if (order.filled_quantity == order.quantity)
            {
                filled.push(order);
                order.status = "filled";
            }
            
        }

        // now after for loop, remove the filled orders from the makerlevel
        for (let i = 0; i < filled.length; i++)
        {
            // remove the 1st element as it is processed first.
            makerLevel.orders.shift();
        }
    }
}
