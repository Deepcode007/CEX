import { client, write_client } from "..";
import { prisma } from "../../backend";
import { OrderBook } from "./class/Orderbook"
import { getAllWallet, getWallet } from "./helpers/getWallet";

import type { AssetBalance, Balances, Currency, Orders, UserBalances } from "./types/types";

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
    },
    {
        name: "Tata",
        symbol: "TATA"
    }
] as const;


export let map = new Map<Currency, OrderBook>;
export let curr_Users = new Map<string, Orders[]>;
export let BALANCES: Balances = new Map<string, UserBalances>;

// build orderbooks for each asset/USD market
STOCKS.forEach(x => {
    if(x.symbol!="USD") map.set(x.symbol, new OrderBook(x.symbol));
})

// backend -> read 




while(1)
{
    let data = await client.brPop("queue1_requests", 1);
    if (!data || !data.element)
    {
        continue;
    }

    let inside_data = JSON.parse(data.element);

    let wallet = BALANCES.get(inside_data.order.userId);
    if (!wallet) {
        // from db
        let data = await getAllWallet(inside_data.order.userId);
        
        if (!data || data.length == 0) {
            write_client.rPush("queue1_responses", JSON.stringify({
                id: inside_data.id,
                success: false,
                error: "No wallet found"
            }))
            continue;
        }

        let obj: UserBalances = {};
        for (let i of data)
        {
            obj[i.asset as Currency] = {
                available: i.balance,
                locked: 0
            } as AssetBalance
        }
        BALANCES.set(inside_data.order.userId, obj);
        wallet = BALANCES.get(inside_data.order.userId);
    }
    
    // wallet has SOL USD but dont have BTC
    if (wallet && !wallet[inside_data.order.asset as Currency])
    {
        // from db
        let data = await getWallet(inside_data.order.userId, inside_data.order.asset);

        if (!data) {
            write_client.rPush("queue1_responses", JSON.stringify({
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
    
    if (inside_data.type == "query")
    {
        write_client.rPush("queue1_responses", JSON.stringify({
            id: inside_data.id,
            success: true,
            data: wallet![inside_data.order.asset as Currency]
        }))
        continue;
    }
    // here the request is order related
    let order:Orders = inside_data.order;

    if (!map.get(order.market))
    {
        write_client.rPush("queue1_responses", JSON.stringify({
            success: false,
            error: "Invalid Market"
        }));
        continue;
    }

    if (!wallet)
    {
        console.log("Error, no wallet found!!")
        continue;
    }
    else if (!curr_Users.has(order.userId))
    {
        curr_Users.set(order.userId, []);
        curr_Users.get(order.userId)?.push(order);
    }
    
    let orderbook = map.get(order.market)!;
    
    orderbook.addOrder(order, order.side);
    orderbook.processOrder(order, order.side, order.type);
    
}