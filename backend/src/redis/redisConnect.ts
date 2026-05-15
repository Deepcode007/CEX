import { createClient } from "redis";
import { env } from "../server";

export const publisher = createClient({ url: env?.REDIS_SERVER_URL  }).on("error", (error) => {
  console.error("Redis publisher error", error);
});

export const subscriber = createClient({ url: env?.REDIS_SERVER_URL }).on("error", (error) => {
  console.error("Redis subscriber error", error);
});

export async function connectRedis(): Promise<void> {
  await Promise.all([publisher.connect(), subscriber.connect()]);
}

export async function pingRedis(): Promise<string> {
  return publisher.ping();
}