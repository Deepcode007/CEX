import type { RedisClientType } from "redis";
import { stream_name } from "../..";


type RedisStreamWriter = Pick<RedisClientType, "xAdd">;

export async function sendToWorker(redis_dumper: RedisStreamWriter, payload: Record<string, unknown>)
{
    await redis_dumper.xAdd(stream_name, '*', {
        data: JSON.stringify(payload)
    }).catch(err => {
        console.error(`Failed to publish order ${payload.reason} to stream:`, err);
    });
}
