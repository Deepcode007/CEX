import { envSchema } from "./models/env";

const envResult = envSchema.safeParse({ ...process.env });

const env = envResult.data;

if (!env || !envResult.success || !envResult.data) {
    console.log("Env problem!");
    process.exit(0);
}

export { env };
