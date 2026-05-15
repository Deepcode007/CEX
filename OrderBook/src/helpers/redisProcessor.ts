import type { RedisClientPoolType } from "redis";
import type { Orders } from "../types/types";
import type { Side } from "../../../backend/prisma/generated/enums";
import { dump } from "../redis/dumpRedisWorker";

export async function UpdateToRedis(redis_dumper:RedisClientPoolType, makerOrder: Orders, takerOrder: Orders, req_qty: number)
{
    // DB Updates
    if (takerOrder.side == "bids")
    {
        // decrease maker's USD
        let a = dump(redis_dumper, takerOrder, -req_qty * takerOrder.price, "USD", "maker", "PROCESS_ORDER");
        // increase my USD
        let b = dump(redis_dumper, makerOrder, req_qty * takerOrder.price, "USD", "taker", "PROCESS_ORDER");
    
        // increase maker's asset
        let c = dump(redis_dumper, takerOrder, req_qty, takerOrder.market, "maker", "PROCESS_ORDER");
        // decrease my asset
        let d = dump(redis_dumper, makerOrder, -req_qty, takerOrder.market, "taker", "PROCESS_ORDER");

        await Promise.all([a, b, c, d]);
    }
    else if (takerOrder.side == "asks")
    {
        // increase maker's USD
        let a = dump(redis_dumper, takerOrder, req_qty * takerOrder.price, "USD", "maker", "PROCESS_ORDER");
        // decrease my USD
        let b = dump(redis_dumper, makerOrder, -req_qty * takerOrder.price, "USD", "taker", "PROCESS_ORDER");

        // decrease maker's asset
        let c = dump(redis_dumper, takerOrder, -req_qty, takerOrder.market, "maker", "PROCESS_ORDER");
        // increase my asset
        let d = dump(redis_dumper, makerOrder, req_qty, takerOrder.market, "taker", "PROCESS_ORDER");

        await Promise.all([a, b, c, d]);
    }
}