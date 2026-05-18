import type { Request, Response } from "express";
import { prisma } from "../..";
import type { Status } from "../types/inmemoryTypes";

export async function getAllOrderHandler(req:Request, res:Response)
{
    let q = (req.query.status as Status) || undefined;
    let orders = await prisma.order.findMany({
        where: {
            userId: req.id,
            status: q
        }
    })

    res.status(200).json({
        success: true, 
        data: orders
    })
}