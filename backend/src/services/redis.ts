import { createClient } from 'redis';

const client = createClient({
    url: "redis://127.0.0.1:6379"
});

client.on('error', (err) => console.error('Redis Client Error', err));

await client.connect();

// Test the connection
await client.set("key1", 'value1');
const value = await client.get('key1');
// await client.lPush("hii", JSON.stringify({ data: 1 }));


console.log(value); // Outputs: value

// Remember to close the connection when your app shuts down
// await client.quit();