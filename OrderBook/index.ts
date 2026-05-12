import { createClient } from 'redis';
import { env } from './src/envParse';


export const client = createClient({
    url: env?.REDIS_SERVER_URL
});

export const write_client = createClient({
    url: env?.REDIS_DB_DUMP_URL
});

client.on('error', (err) => console.error('Redis Client Error', err));
write_client.on('error', (err) => console.error('Redis DB Dump Client Error', err));


await Promise.all([
    client.connect(),
    write_client.connect()
]);

