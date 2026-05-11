import { createClient } from 'redis';
import { env } from './src/Parseenv';


const walletClient = createClient({
    url: env?.REDIS_SERVER_URL
});

walletClient.on('error', (err) => console.error('Redis Client Error', err));

await walletClient.connect();

export {walletClient};

// // Test the connection
// await client.set('key', 'value');
// const value = await client.get('key');
// console.log(value); // Outputs: value

// Remember to close the connection when your app shuts down
// await client.quit();   