import { client, write_client } from "..";
import { OrderBook } from "./class/Orderbook"
import { getWallet } from "./helpers/getWallet";

import type { Balances, Orders, UserBalances } from "./types/types";

const STOCKS = [
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
]


export let map = new Map<string, OrderBook>;
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
    if (inside_data.type == "query")
    {
        write_client.rPush("queue1_responses", JSON.stringify({
            id: inside_data.id,
            success: true,
            data: // get user wallet from in memory
        }))
    }
    let order:Orders = inside_data.order;

    if (!map.has(order.market))
    {
        // promise, but okay
        write_client.rPush("queue1_responses", JSON.stringify({
            success: false,
            error: "Invalid Market"
        }));
        continue;
    }

    if (!curr_Users.has(order.userId))
    {
        let wallet = await getWallet(order.userId, order.market)
        if (!wallet)
        {
            console.log("Error, no wallet found!!")
            continue;
        }
        // set in memory the user's wallet
    }

    let orderbook = map.get(order.market) as OrderBook;
    orderbook.addOrder(order, order.side)
    
}