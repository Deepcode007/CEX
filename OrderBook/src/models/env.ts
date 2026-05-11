import zod from "zod";

export const envSchema = zod.object({
    REDIS_SERVER_URL: zod.string(),
    REDIS_WALLET_URL: zod.string()
})