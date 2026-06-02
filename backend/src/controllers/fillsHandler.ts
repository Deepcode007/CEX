import type { Request, Response } from "express";
import { prisma } from "../..";

export async function fillsHandler(req: Request, res: Response) {
    let market = req.params.symbol as string || undefined;
    if (!market) {
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

    if (!asset) {
        return res.status(400).json({
            success: false,
            error: "Asset Unsupported"
        });
    }

    let fills = await prisma.fills.findMany({
        where: {
            asset: market
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 100
    })


    return res.status(200).json({
        success: true,
        data: fills
    })
}
