import zod from "zod";

export const envSchema = zod.object({
    REDIS_SERVER_URL: zod.string(),
    REDIS_LISTEN_QUEUE: zod.string(),
    REDIS_DB_DUMP_URL: zod.string(),
    REDIS_SEND_QUEUE: zod.string()
})
