import type { Request, Response, NextFunction } from "express";
import { OrderSchema } from "../models/order";
import { check_zod } from "../lib/helpers";
import { getBalance } from "../lib/getbalance";
import { ORDERS, type order } from "../inmemory";
import type { Orders } from "../types/inmemoryTypes";
import { getMarketbuy } from "../lib/getMarketBuy";

export function Orderhandler(req:Request, res:Response)
{
    // body: { userId, side: "BUY"|"SELL", type: "LIMIT"|"MARKET", symbol, price?, qty }
    // 1. validate input + stock exists
    // 2. check + lock balance (INR for BUY, stock for SELL)
    // 3. run matching engine against opposite side of ORDERBOOK
    // 4. write fills to FILLS, update filledQty + status on ORDERS
    // 5. if leftover qty and LIMIT, rest on book; if MARKET, cancel remainder
    // 6. settle balances on each fill (move locked -> other asset's available)

    const result = OrderSchema.safeParse(req.body);
    const data = check_zod(result, res);

    if (data.side == "buy")
    {
        let balance = getBalance("USD", req.id);
        if (balance < data.price * data.quantity)
        {
            return res.status(400).json({
                success: false,
                error: "Insufficient balance"
            });
        }



        if (data.type == "market")
        {
            // i need to check if the orderbook has enough qty and then
            // check the price against the user's balance.
            //
            // if enough qty available then taker or else maker for the rest amt

            // get sorted orders

            const { best, qty, total_price } = getMarketbuy(data.quantity, data.symbol) as { best: order[]; qty: number; total_price: number; };

            let side;
            if (qty >= data.quantity) side = "taker";
            else side = "maker";

            let amt = 0, quantity=0;

            for (let i of best)
            {
                if (quantity + i.quantity <= data.quantity)
                {
                    quantity += i.quantity;
                    amt += i.quantity * i.price;
                }
                else
                {
                    quantity += (i.quantity - (data.quantity - quantity));
                    amt += i.price * (i.quantity - (data.quantity - quantity));
                    break;
                }
            }

            if (balance <= amt)
            {
                return;
            }
        }

        let order: Orders = {
            userId: req.id,
            type: data.type,
            market: data.symbol,
            price: data.price,
            quantity: data.quantity,
            side: data.side
        }
        ORDERS.push()
    }
}
