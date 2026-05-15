import { createClientPool } from "@redis/client";
import { env } from "./envParse";
import { prisma } from "../../backend";
import type { response } from "./types/response";

const stream_name = "DB_DUMP_STREAM";
const readStream = createClientPool({ url: env?.REDIS_SERVER_URL })
await readStream.connect();

let lastId = '$';
while(true)
{
    let response = await readStream.xRead(
      [
        {
          key: stream_name,
          id: lastId // Use '$' for new messages, or '0-0' for all history
        }
      ],
      {
        BLOCK: 0, // 0 blocks indefinitely until a message arrives
        COUNT: 50
      }
    ) as any[];

    if (!response || response.length==0)
    {
        continue;
    }

    const messages = response[0].messages;

    for (let items of messages)
    {
        let parsed = JSON.parse(items.message.data) as response;
        let wallet = await prisma.wallet.findFirst({
            where: {
                userid: parsed.userId,
                asset: parsed.asset
            }
        });

        if (parsed.reason == "CREATE_ORDER")
        {
            let { reason, ...data } = parsed;
            await prisma.order.create({
                data: data
            })
        }
        else if (parsed.reason == "PROCESS_ORDER")
        {
            await prisma.$transaction([
                prisma.transactions.create({
                    data: {
                        id: parsed.id,
                        userid: parsed.userId,
                        walletId: wallet!.id,
                        type: parsed.reason,
                        delta: parsed.delta,
                        createdAt: parsed.createdAt
                    }
                }),
                prisma.wallet.update({
                    data: {
                        balance: {
                            increment: parsed.delta
                        }
                    },
                    where: {
                        id: wallet!.id
                    }
                }),
                prisma.fills.create({
                    data: {
                        userId: parsed.userId,
                        market: parsed.asset,
                        orderId: parsed.id,
                        filled_quantity: parsed.filled_quantity,
                        quantity: parsed.quantity,
                        price: parsed.price,
                        side: parsed.side,
                        type: parsed.type,
                        status: (parsed.filled_quantity === parsed.quantity ? "filled" : "open"),
                        createdAt: parsed.createdAt
                    }
                }),
                prisma.order.update({
                    where: {
                        id: parsed.id
                    },
                    data: {
                        status: (parsed.filled_quantity === parsed.quantity)?"filled": "open",
                        filled_quantity: parsed.filled_quantity,
                        closedAt: new Date()
                    }
                })
            ])
        }
        else if (parsed.reason == "DEPOSIT" || parsed.reason=="WITHDRAW")
        {
            if (!wallet || (parsed.reason=="WITHDRAW" && wallet.balance<parsed.delta)) continue;
            await prisma.$transaction([
                prisma.wallet.update({
                    where: {
                        userid_asset: {
                            userid: parsed.userId,
                            asset: parsed.asset,
                        }
                    },
                    data: {
                        balance: {
                            increment: parsed.delta
                        }
                    }
                }),
                prisma.transactions.create({
                    data: {
                        userid: parsed.userId,
                        walletId: wallet?.id as string,
                        type: parsed.reason,
                        delta: parsed.delta,
                        createdAt: parsed.createdAt
                    }
                })
            ])
        }
        else if (parsed.reason == "CANCEL_ORDER")
        {
            prisma.order.update({
                where: {
                    userId: parsed.userId,
                    id: parsed.id
                },
                data: {
                    status: "cancelled"
                }
            })

            prisma.wallet.update({
                where: {
                    userid_asset: {
                        userid: parsed.userId,
                        asset: parsed.asset
                    }
                },
                data: {
                    balance: {
                        increment: parsed.delta
                    }
                }
            })
        }

        lastId = items.id;
    };
    console.log(response);

}
