export interface Orders {
    userId: string,
    market: string,
    price: number,
    quantity: number,
    type: Type,
    side: Side,
    filled_quantity: number,
    status: Status,
    createdAt: Date,
    fills: number
}

export interface Fills {
    userId: string,
    market: string,
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

export type Currency = "USD" | "INR";
export type Type = "limit" | "market";
export type Side = "taker" | "maker";
export type Status = "open" | "filled" | "cancelled";


export type UserBalances = Record<Currency, AssetBalance>;

export type Balances = Record<string, UserBalances>;