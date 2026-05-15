import type { Request, Response } from "express";
import zod from "zod";
import { check_zod } from "../lib/helpers";
import { sendToEngine } from "../redis/redisSend";
export async function AddBalance(req: Request, res: Response)
{
    const result = zod.object({
        asset: zod.string(),
        delta: zod.number().min(1)
    }).safeParse(req.body);
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
        
    // add it to orderbook

    let response = await sendToEngine("deposit", {
        userId: req.id,
        asset: data.asset,
        delta: data.delta
    });

    if (!response.success)
    {
        return res.status(400).json({
            success: false,
            error: response.error
        })
    }

    res.status(200).json({
        success: true,
        data: response.data
    });
}