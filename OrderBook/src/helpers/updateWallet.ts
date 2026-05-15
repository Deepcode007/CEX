import type { RedisClientType } from "redis";
import { sendToWorker } from "../redis/SendRedisWorker";
import type { Currency, worker_reason_type } from "../types/types";

type RedisStreamWriter = Pick<RedisClientType, "xAdd">;

export async function updateWalletDB(redis_dumper: RedisStreamWriter, userId: string, asset: Currency, delta: number)
{
    await sendToWorker(redis_dumper, {
        reason: "DEPOSIT" as worker_reason_type,
        userId: userId,
        asset: asset,
        delta: delta
    })
}
