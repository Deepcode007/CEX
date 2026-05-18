export interface Orders {
    userId: string,
    market: string,
    price: number | null,
    quantity: number,
    type: Type,
    side: Side,
    filled_quantity: number,
    status: Status,
    createdAt: Date,
}

export type Type = "limit" | "market";
export type Side = "taker" | "maker";
export type Status = "open" | "filled" | "cancelled";
