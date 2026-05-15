import { createClient } from 'redis';
import { env } from './src/envParse';

export const stream_name = "DB_DUMP_STREAM";

export const responseClient = createClient({
    url: env?.REDIS_SERVER_URL
});

export const readClient = createClient({
    url: env?.REDIS_SERVER_URL
});

export const toWorker = createClient({
    url: env?.REDIS_DB_DUMP_URL
});

responseClient.on('error', (err) => console.error('Redis Client Error', err));
readClient.on('error', (err) => console.error('Redis DB Dump Client Error', err));
toWorker.on('error', (err) => console.error('Redis DB Dump Global Client Error', err));


await Promise.all([
    responseClient.connect(),
    readClient.connect(),
    toWorker.connect()
]);

