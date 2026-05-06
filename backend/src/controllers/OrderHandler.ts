import type { Request, Response, NextFunction } from "express";
import { OrderSchema } from "../models/order";
import { check_zod } from "../lib/helpers";
import { ORDERBOOK } from "../inmemory";

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
    if (!data) {
        return;
    }
}