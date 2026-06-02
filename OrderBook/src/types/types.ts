import type { STOCKS } from "../server";
import { type UUID } from "crypto";

export interface Orders {
    userId: string;
    asset: Currency;
    price: number;
    quantity: number;
    type: Type;
    side: Side;
    filled_quantity: number;
    status: Status;
    createdAt: Date;
    id: string;
    filled?: number;
}

export interface Fills {
    userId: string;
    market: Currency;
    price: number;
    quantity: number;
    type: Type;
    side: Side;
    filled_quantity: number;
    status: Status;
    createdAt: Date;
    orderId: string;
}

export type AssetBalance = {
    available: number;
    locked: number;
};

export interface Pricelevel {
    price: number;
    total_quantity: number;
    orders: Orders[];
}

type StockType = (typeof STOCKS)[number]["symbol"];

export type Currency = StockType;
export type Type = "limit" | "market";
export type Side = "bids" | "asks";
export type Status = "open" | "filled" | "cancelled";

export type UserBalances = Partial<Record<Currency, AssetBalance>>;

export type Balances = Map<string, UserBalances>;

export type redis_dump_type = {
    userId: string;
    id: string;
    asset: Currency;
    delta: number;
    reason: "PROCESS_ORDER";
    createdAt: Date;
    side: "taker" | "maker";
    filled_quantity: number;
    quantity: number;
    price: number;
    type: "limit" | "market";
};

export type worker_reason_type =
    | "PROCESS_ORDER"
    | "DEPOSIT"
    | "WITHDRAW"
    | "CANCEL_ORDER"
    | "CREATE_ORDER";

export type EngineCommandType =
    | "create_order"
    | "get_depth"
    | "get_user_balance"
    | "get_order"
    | "cancel_order"
    | "deposit"
    | "withdraw";

export type EngineRequest = {
    id: UUID;
    responseQueue: string;
    type: EngineCommandType;
    order: Record<any, any>;
};
