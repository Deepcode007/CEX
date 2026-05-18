import zod from "zod";
export const envSchema = zod.object({
    REDIS_SERVER_URL: zod.string(),
    DATABASE_URL: zod.string()
})