import type { Request, Response } from "express";
import zod from "zod";
import { check_zod } from "../lib/helpers";
import { WalletSchema } from "../models/wallet";
import { sendToEngine } from "../redis/redisSend";

export async function getbalance(req:Request, res:Response)
{
    const result = WalletSchema.safeParse(req.body);
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

    let a = await sendToEngine("get_user_balance", {
        userId: req.id,
        asset: data.asset
    });

    if (a.success)
    {
        res.status(200).json({
            success: true, 
            data: a.data
        })
    }
    else {
        res.status(400).json({
            success: false,
            error: a.error
        })
    }
    
}