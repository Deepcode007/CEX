import type { RedisClientType } from "redis";
import { sendToWorker } from "../redis/SendRedisWorker";
import type { Currency, worker_reason_type } from "../types/types";

type RedisStreamWriter = Pick<RedisClientType, "xAdd">;

export async function cancelOrder(redis_dumper: RedisStreamWriter, userId: string, orderId: string, asset: string, delta: number)
{
    await sendToWorker(redis_dumper, {
        reason: "CANCEL_ORDER" as worker_reason_type,
        userId: userId,
        orderId: orderId,
        asset: asset,
        delta: delta
    })
}
