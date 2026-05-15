import { type UUID } from "crypto";

export type EngineResponse = {
    id: UUID,
    success: false,
    error: string
} | {
    id: UUID,
    success: true,
    data: Record<any,any>
}


export type EngineRequest = {
    id: UUID,
    responseQueue: string;
    type: EngineCommandType,
    order: Record<any, any>
}



export type EngineCommandType =
  | "create_order"
  | "get_depth"
  | "get_user_balance"
  | "get_order"
  | "cancel_order"
  | "deposit"
  | "withdraw";