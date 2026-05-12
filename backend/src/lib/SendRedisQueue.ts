import { client } from "../server";
import type { Orders } from "../types/inmemoryTypes";

export async function placeOrder(order: Orders)
{
    await client.lPush("queue1", JSON.stringify({
        type: "order",
        order: order
    }))
}