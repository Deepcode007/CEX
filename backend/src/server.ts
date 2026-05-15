import express from "express";
import { env } from "./config/env";
import { listenForEngineResponses } from "./redis/redisListener";
import { connectRedis, pingRedis } from "./redis/redisConnect";

export const app = express();
app.use(express.json());

await connectRedis();
void listenForEngineResponses();

app.get("/health", async (_req, res) => {
    await pingRedis();
    res.json({ ok: true });
});

await import("./routes/routes");

const server = app.listen(env?.PORT, () => {
    console.log(`Backend running on http://localhost:${env?.PORT}`);
    console.log(`Response queue: ${env?.backend_Id}`);
});
