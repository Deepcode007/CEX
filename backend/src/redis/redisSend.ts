import { env } from "../server";
import { waitForEngineResponse } from "../store/redis_Responses";
import type { EngineCommandType, EngineRequest, EngineResponse } from "../types/redis_types";
import { publisher } from "./redisConnect";

export async function sendToEngine(
  type: EngineCommandType,
  payload: Record<string, unknown>,
): Promise<EngineResponse> {
  const correlationId = crypto.randomUUID();
  const responsePromise = waitForEngineResponse(correlationId, env?.ENGINE_TIMEOUT_MS as number);

  const message: EngineRequest = {
    id: correlationId,
    responseQueue: env?.backend_Id as string,
    type,
    order: payload,
  };

  await publisher.lPush(env!.REDIS_SEND_QUEUE, JSON.stringify(message));
  return responsePromise;
}