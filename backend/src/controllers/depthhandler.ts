import type { Request, Response } from "express";
import { prisma } from "../..";
import { sendToEngine } from "../redis/redisSend";

export async function depthHandler(req:Request, res:Response)
{
    let market = req.params.symbol as string || undefined;
    if (!market)
    {
        return res.status(400).json({
            success: false,
            error: "Market required"
        });
    }

    market = market.slice(0, 3);
    
    let asset = await prisma.stock.findUnique({
        where: {
            symbol: market
        }
    });
    if(!asset)
    {
        return res.status(400).json({
            success: false,
            error: "Asset Unsupported"
        });
    }

    let a = await sendToEngine("get_depth", {
        asset: market
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