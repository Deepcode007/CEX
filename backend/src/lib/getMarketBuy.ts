import { ORDERBOOK } from "../inmemory";

export function getMarketbuy(quantity:number, asset:string)
{
    let best = [];
    let qty = 0, total_price=0;
    if (!ORDERBOOK[asset] || !ORDERBOOK[asset].bids)
    {
        return;
    }

    for (let i of ORDERBOOK[asset].bids.data)
    {
        if (qty >= quantity) break;
        qty += i.quantity;
        total_price += i.quantity * i.price;
        best.push(i);
    }

    return { best, qty, total_price };
}