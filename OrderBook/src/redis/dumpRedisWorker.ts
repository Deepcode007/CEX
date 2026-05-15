import type { RedisClientPoolType } from "redis";
import { stream_name } from "../..";
import type { Orders, redis_dump_type, worker_reason_type } from "../types/types";
import type { Side } from "../../../backend/prisma/generated/enums";


export async function dump(redis_dumper:RedisClientPoolType, order: Orders, req_qty: number, asset: string, side:Side, reason:worker_reason_type )
{
    await redis_dumper.xAdd(stream_name, '*', {
        data: JSON.stringify({
            userId: order.userId,
            id: order.id,
            asset: asset,
            delta: req_qty,
            reason: reason,
            createdAt: new Date(),
            side: side,
            filled_quantity: order.filled_quantity,
            quantity: order.quantity,
            price: order.price,
            type: "limit",
        } as redis_dump_type)
    }).catch(err => {
        console.error(`Failed to publish order ${order.id} to stream:`, err);
    });
}
