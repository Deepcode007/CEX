import zod from "zod";

export const envSchema = zod.object({
    DATABASE_URL: zod.string(),
    PORT: zod.coerce.number(),
    REDIS_SERVER_URL: zod.string(),
    REDIS_WORKER_URL: zod.string(),
    REDIS_SEND_QUEUE: zod.string(),
    backend_Id: zod.string(),
    ENGINE_TIMEOUT_MS: zod.number()
})