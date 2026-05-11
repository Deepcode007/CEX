import { client, walletClient } from "..";
import { OrderBook } from "./class/Orderbook"
import { getWallet } from "./helpers/getWallet";
import { initUserWallet } from "./helpers/initWalletredis";
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
    if(x.symbol!="USD")map.set(x.symbol, new OrderBook(x.symbol));
})




async function getData()
{
    let data = await client.brPop("queue1", 1);
    if (!data || !data.element)
    {
        getData();
        return;
    }
    let order:Orders = JSON.parse(data.element);

    if (!map.has(order.market))
    {
        // promise, but okay
        client.rPush("returnQueue", JSON.stringify({
            success: false,
            error: "Invalid Market"
        }));
        getData();
        return;
    }

    if (!curr_Users.has(order.userId))
    {
        let wallet = await getWallet(order.userId, order.market)
        if (!wallet)
        {
            console.log("Error, no wallet found!!")
            return;
        }
        await initUserWallet(order.userId, order.market, wallet.balance)
    }

    let orderbook = map.get(order.market) as OrderBook;
    orderbook.addOrder(order, order.side)
    getData();
}