import type { Request, Response } from "express";
import { OrderSchema } from "../models/order";
import { check_zod } from "../lib/helpers";
import { STOCKS } from "../inmemory";
import type { Orders } from "../types/inmemoryTypes";
import { sendToEngine } from "../redis/redisSend";
import { randomUUID } from "crypto";

export async function Orderhandler(req: Request, res: Response) {
    // body: { userId, side: "BUY"|"SELL", type: "LIMIT"|"MARKET", symbol, price?, qty }
    // 1. validate input + stock exists
    // 2. check + lock balance (INR for BUY, stock for SELL)
    // 3. run matching engine against opposite side of ORDERBOOK
    // 4. write fills to FILLS, update filledQty + status on ORDERS
    // 5. if leftover qty and LIMIT, rest on book; if MARKET, cancel remainder
    // 6. settle balances on each fill (move locked -> other asset's available)

    const result = OrderSchema.safeParse(req.body);
    let data;
    try {
        data = check_zod(result, res);
    }
    catch {
        return res.status(400).json({
            success: false,
            error: "Invalid Schema"
        })
    }

    if (!STOCKS.has(data.symbol)) {
        return res.status(400).json({
            success: false,
            error: "Invalid Stock/Asset"
        });
    }

    let obj: Orders = {
        userId: req.id,
        asset: data.symbol,
        quantity: data.quantity,
        type: data.type,
        side: "taker",
        filled_quantity: 0,
        status: "open",
        price: null,
        createdAt: new Date()
    }

    if (data.type == "limit") {
        obj.price = data.price;
    }

    let response = await sendToEngine("create_order", {
        userId: req.id,
        asset: data.symbol,
        price: data.price,
        quantity: data.quantity,
        type: data.type,
        side: data.side == "sell" ? "asks" : "bids",
        filled_quantity: 0,
        status: "open",
        createdAt: new Date(),
        id: randomUUID(),
    })

    if (!response.success) {
        return res.status(400).json({
            success: false,
            error: response.error
        })
    }


    res.status(201).json({
        success: true,
        data: {
            orderId: response.id,
            asset: data.symbol,
            quantity: data.quantity,
            filled_quantity: response.data.filled_quantity,
            type: data.type,
            status: response.data.status
        }
    })
}
