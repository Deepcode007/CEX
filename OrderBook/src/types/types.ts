import type { STOCKS } from "../server";

export interface Orders {
    userId: string,
    market: Currency,
    price: number,
    quantity: number,
    type: Type,
    side: Side,
    filled_quantity: number,
    status: Status,
    createdAt: Date,
    fills: number
    id: string
}


export interface Fills {
    userId: string,
    market: Currency,
    price: number,
    quantity: number,
    type: Type,
    side: Side,
    filled_quantity: number,
    status: Status,
    createdAt: Date,
    orderId: string
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

type StockType = typeof STOCKS[number]["symbol"];

export type Currency = StockType;
export type Type = "limit" | "market";
export type Side = "bids" | "asks";
export type Status = "open" | "filled" | "cancelled";


export type UserBalances = Partial<Record<Currency, AssetBalance>>;

export type Balances = Map<string, UserBalances>;

export type redis_dump_type = {
    userId: string,
    orderId: string,
    asset: Currency,
    delta: number,
    reason: "PROCESS_ORDER";
    createdAt: Date,
    side: "taker" | "maker",
    filled_quantity: number,
    quantity: number;
    price: number;
    type: "limit" | "market"
}
