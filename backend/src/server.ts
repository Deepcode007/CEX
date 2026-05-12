import  express from "express";
import { envSchema } from "./models/env";
import { createClient } from 'redis';


const envResult = envSchema.safeParse({...process.env});

export const app = express();
app.use(express.json());

export const env = envResult.data;

export const client = createClient({
    url: env?.REDIS_SERVER_URL
});

export const read_client = createClient({
    url: env?.REDIS_SERVER_URL
});

client.on('error', (err) => console.error('Redis Client Error', err));
read_client.on('error', (err) => console.error('Redis Client Error', err));


Promise.all([
    client.connect(),
    read_client.connect()
]);

const server = app.listen(env?.PORT);

if (!envResult.success || !envResult.data)
{
    server.close(() => {
        console.log("Env problem!")
        process.exit(0);
    });
}


// didnt yet read the return queue from the orderbook