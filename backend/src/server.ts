import  express from "express";
import { envSchema } from "./models/env";

const envResult = envSchema.safeParse({...process.env});

export const app = express();
app.use(express.json());

export const env = envResult.data;
const server = app.listen(env?.PORT);

if (!envResult.success || !envResult.data)
{
    server.close(() => {
        console.log("Env problem!")
        process.exit(0);
    });
}
