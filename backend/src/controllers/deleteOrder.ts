import type { Request, Response } from "express";
import { sendToEngine } from "../redis/redisSend";

export async function deleteHandler(req: Request, res: Response) {
    let orderId = req.params.orderId;
    if (!orderId) {
        return res.status(400).json({
            success: false,
            error: "Order Id is required"
        })
    }


    let response = await sendToEngine("cancel_order", {
        userId: req.id,
        orderId: orderId
    });

    console.log(response);

    if (response.success) {
        return res.status(200).json({
            success: true,
            data: response.data
        })
    }
    else {
        return res.status(400).json({
            success: false,
            data: response.error
        })
    }
}
