import zod from "zod";

export const envSchema = zod.object({
    DATABASE_URL: zod.string(),
    PORT: zod.coerce.number()
})