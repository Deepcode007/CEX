import { readClient, responseClient, toWorker } from "..";
import { OrderBook } from "./class/Orderbook"
import { cancelOrder } from "./helpers/cancelOrder";
import { getAllWallet, getWallet } from "./helpers/getWallet";
import { updateWalletDB } from "./helpers/updateWallet";

import type { AssetBalance, Balances, Currency, EngineRequest, Orders, UserBalances } from "./types/types";

export const STOCKS = [
    {
        name: "Solana",
        symbol: "SOL"
    },
    {
        name: "Dollar",
        symbol: "USD"
    },
    {
        name: "Etherium",
        symbol: "ETH"
    }
] as const;


export let map = new Map<Currency, OrderBook>;
export let curr_Users = new Map<string, Orders[]>;
export let BALANCES: Balances = new Map<string, UserBalances>;

// build orderbooks for each asset/USD market
STOCKS.forEach(x => {
    if (x.symbol != "USD") map.set(x.symbol, new OrderBook(x.symbol));
})

// backend -> read 




while (1) {
    let data = await readClient.brPop("queue1_requests", 1);
    if (!data || !data.element) {
        continue;
    }

    console.log("data: ", data)

    let inside_data = JSON.parse(data.element) as EngineRequest;
    console.log("inside data: ", inside_data);

    if (inside_data.type == "get_depth") {
        let orderbook = map.get(inside_data.order.asset);
        let depth = orderbook?.getDepth();

        responseClient.rPush(inside_data.responseQueue, JSON.stringify({
            id: inside_data.id,
            success: true,
            data: depth
        }))
        continue;
    }

    let wallet = BALANCES.get(inside_data.order.userId);
    if (!wallet) {
        // from db
        let data = await getAllWallet(inside_data.order.userId);

        if (!data || data.length == 0) {
            responseClient.rPush(inside_data.responseQueue, JSON.stringify({
                id: inside_data.id,
                success: false,
                error: "No wallet found"
            }))
            continue;
        }

        let obj: UserBalances = {};
        for (let i of data) {
            obj[i.asset as Currency] = {
                available: i.balance,
                locked: 0
            } as AssetBalance
        }
        BALANCES.set(inside_data.order.userId, obj);
        wallet = BALANCES.get(inside_data.order.userId);
    }

    // wallet has SOL USD but dont have BTC
    if (wallet && !wallet[inside_data.order.asset as Currency]) {
        // from db
        let data = await getWallet(inside_data.order.userId, inside_data.order.asset);

        if (!data) {
            responseClient.rPush(inside_data.responseQueue, JSON.stringify({
                id: inside_data.id,
                success: false,
                error: `No wallet with ${inside_data.order.asset} found`
            }))
            continue;
        }

        wallet[inside_data.order.asset as Currency] = {
            available: data.balance,
            locked: 0
        };
    }

    if (inside_data.type == "deposit" || inside_data.type == "withdraw") {
        wallet![inside_data.order.asset as Currency]!.available += inside_data.order.delta;
        updateWalletDB(toWorker, inside_data.order.userId, inside_data.order.asset, inside_data.order.delta);
        responseClient.rPush(inside_data.responseQueue, JSON.stringify({
            id: inside_data.id,
            success: true,
            data: wallet![inside_data.order.asset as Currency]
        }));
        continue;
    }

    if (inside_data.type == "get_user_balance") {
        responseClient.rPush(inside_data.responseQueue, JSON.stringify({
            id: inside_data.id,
            success: true,
            data: wallet![inside_data.order.asset as Currency]
        }))
        continue;
    }

    if (!map.get(inside_data.order.asset)) {
        responseClient.rPush(inside_data.responseQueue, JSON.stringify({
            id: inside_data.id,
            success: false,
            error: "Invalid Market"
        }));
        continue;
    }

    if (inside_data.type == "cancel_order") {
        let orders = curr_Users.get(inside_data.order.userId);
        let order = orders?.find(x => {
            if (x.id == inside_data.order.orderId) return x;
        })

        if (!order) {
            responseClient.rPush(inside_data.responseQueue, JSON.stringify({
                id: inside_data.id,
                success: false,
                error: "Order not found"
            }));
            continue;
        }

        if (order.status == "cancelled" || order.status == "filled") {
            responseClient.rPush(inside_data.responseQueue, JSON.stringify({
                id: inside_data.id,
                success: false,
                error: `Order already ${order.status}`
            }));
            continue;
        }

        let orderbook = map.get(order.asset)!;

        let status = orderbook.cancelOrder(order.id, order.side)
        if (typeof (status) == 'object') {
            cancelOrder(toWorker, order.userId, order.id, order.asset, status.delta);
            responseClient.rPush(inside_data.responseQueue, JSON.stringify({
                id: inside_data.id,
                success: true,
                data: "Order cancelled"
            }));
            continue;
        }
        else {
            responseClient.rPush(inside_data.responseQueue, JSON.stringify({
                id: inside_data.id,
                success: false,
                error: "Some error"
            }));
            continue;
        }
    }

    // here the request is order related
    let order = inside_data.order as Orders;

    if (!wallet) {
        console.log("Error, no wallet found!!")
        continue;
    }
    else if (!curr_Users.has(order.userId)) {
        curr_Users.set(order.userId, []);
        curr_Users.get(order.userId)?.push(order);
    }

    if ((order.side == "bids" && order.price * order.quantity > wallet["USD"]!.available) || (order.side == "asks" && order.quantity > wallet[order.asset]!.available)) {
        responseClient.rPush(inside_data.responseQueue, JSON.stringify({
            id: inside_data.id,
            success: false,
            error: "Insufficient balance"
        }));
        continue;
    }
    let orderbook = map.get(order.asset)!;

    orderbook.addOrder(order, order.side);
    orderbook.processOrder(order, order.side, order.type);

    responseClient.rPush(inside_data.responseQueue, JSON.stringify({
        id: inside_data.id,
        success: true,
        data: orderbook.getDetails(order.id)
    }))
}
