import { randomUUID } from "crypto";
import { publisher } from "./redisConnect";

export async function toOrderbook( type: "DEPOSIT"|"WITHDRAW", uid:string, asset: string, delta: number)
{
    await publisher.lPush("queue1_requests", JSON.stringify({
        id: randomUUID(),
        type: type,
        order: {
            userid: uid,
            asset: asset,
            delta: delta
        }
    }))
}