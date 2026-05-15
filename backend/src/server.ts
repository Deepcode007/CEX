import  express from "express";
import { envSchema } from "./models/env";
import { createClient } from 'redis';
import { connectRedis, pingRedis } from "./redis/redisConnect";
import { listenForEngineResponses } from "./redis/redisListener";


const envResult = envSchema.safeParse({...process.env});

export const app = express();
app.use(express.json());

export const env = envResult.data;

await connectRedis();
void listenForEngineResponses();

app.get("/health", async (_req, res) => {
  await pingRedis();
  res.json({ ok: true });
});




const server = app.listen(env?.PORT, () => {
    console.log(`Backend running on http://localhost:${env?.PORT}`);
    console.log(`Response queue: ${env?.backend_Id}`);
});

if (!envResult.success || !envResult.data)
{
    server.close(() => {
        console.log("Env problem!")
        process.exit(0);
    });
}


// didnt yet read the return queue from the orderbook