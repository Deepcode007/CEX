import { createClient } from 'redis';
import { env } from './src/envParse';


export const client = createClient({
    url: env?.REDIS_SERVER_URL
});

client.on('error', (err) => console.error('Redis Client Error', err));

const walletClient = createClient({
    url: env?.REDIS_WALLET_URL
});

walletClient.on('error', (err) => console.error('Redis Wallet Client Error', err));

await Promise.all([
    client.connect(),
    walletClient.connect()
]);


export { walletClient };

// // Test the connection
// await client.set('key', 'value');
// const value = await client.get('key');
// console.log(value); // Outputs: value

// Remember to close the connection when your app shuts down
// await client.quit();   