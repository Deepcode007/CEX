import { client, read_client } from "../server";
import { randomUUID } from "crypto";

interface PendingRequest {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timer: NodeJS.Timeout; // For timeout cleanup
}

// Global mapping of Correlation ID -> Promise Resolvers
const promise_obj: Record<string, PendingRequest> = {};

export async function startResponseListener(client: any) {
    while (true) {
        try {
            // Listen on a dedicated RESPONSE queue
            const data = await read_client.brPop("queue1_responses", 0);
            if (!data) continue;

            const parsed = JSON.parse(data.element);
            const correlationId = parsed.correlationId; // Match the unique request ID

            if (promise_obj[correlationId]) {
                // 1. Clear the timeout so it doesn't reject later
                clearTimeout(promise_obj[correlationId].timer);
                
                // 2. Resolve the stored promise
                promise_obj[correlationId].resolve(parsed.data);
                
                // 3. CRITICAL: Delete from memory to prevent leaks
                delete promise_obj[correlationId];
            }
        } catch (error) {
            console.error("Error processing queue response:", error);
            // Keeps the loop alive even if JSON.parse fails on a malformed message
        }
    }
}

export async function getBalance(asset: string, uid: string): Promise<any> {
    const requestQueue = "queue1_requests";
    const correlationId = randomUUID();

    const customPromise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            delete promise_obj[correlationId];
            reject(new Error(`Request timeout for asset: ${asset}`));
        }, 10000);

        promise_obj[correlationId] = { resolve, reject, timer };
    });

    // Push the request payload to the worker queue
    await client.lPush(requestQueue, JSON.stringify({
        correlationId: correlationId, // Pass this so the worker can send it back!
        type: "query",
        order: {
            userId: uid,
            asset: asset
        }
    }));
    const rawData = await customPromise;

    return typeof rawData === "string" ? JSON.parse(rawData) : rawData;
}

