import { env } from "../config/env";
import { resolveEngineResponse } from "../store/redis_Responses";
import type { EngineResponse } from "../types/redis_types";
import { subscriber } from "./redisConnect";


export async function listenForEngineResponses(): Promise<void> {
  console.log(`Listening for engine responses on ${env?.backend_Id}`);

  for (;;) {
    const response = await subscriber.brPop(env?.backend_Id as string, 0);
    if (!response) continue;

    try {
      const parsedResponse = JSON.parse(response.element) as EngineResponse;
      resolveEngineResponse(parsedResponse);
    } catch (error) {
      console.error("Invalid engine response", error);
    }
  }
}
