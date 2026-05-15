import type { Request, Response } from "express";
import { check_zod } from "../lib/helpers";
import { WalletSchema } from "../models/wallet";
import { prisma } from "../..";

export async function CreateWallet(req:Request, res:Response)
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

    // check if wallet already exists;
    let existing = await prisma.wallet.findUnique({
        where: {
            userid_asset: {
                userid: req.id,
                asset: data.asset
            }
        }
    })

    if (existing!=null)
    {
        return res.status(400).json({
            success: false,
            error: "Wallet already exists"
        })
    };

    // check if asset is supported;

    let assets = await prisma.stock.findUnique({
        where: {
            symbol: data.asset
        }
    });
    if(!assets)
    {
        return res.status(400).json({
            success: false,
            error: "Asset Unsupported"
        });
    }

    let newwallet = await prisma.wallet.create({
        data: {
            userid: req.id,
            asset: data.asset,
            balance: 0
        }
    })

    res.status(201).json({
        success: true,
        data: newwallet
    });
}