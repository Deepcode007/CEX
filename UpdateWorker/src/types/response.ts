import zod from "zod";

export type StreamMessageReason = 
  | 'DEPOSIT'
  | 'FEE_DEDUCTION'
  | 'WITHDRAW'
  | 'PROCESS_ORDER'
  | 'CREATE_ORDER';

export type response = {
    userId: string,
    orderId: string,
    asset: string,
    delta: number,
    reason: "DEPOSIT";
    createdAt: Date
} |
{
    userId: string,
    orderId: string,
    asset: string,
    delta: number,
    reason: "WITHDRAW";
    createdAt: Date
} |
{
    userId: string,
    id: string,
    asset: string,
    delta: number,
    reason: "PROCESS_ORDER";
    createdAt: Date,
    side: "taker" | "maker",
    filled_quantity: number,
    quantity: number;
    price: number;
    type: "limit" | "market"
} |
{
    userId: string,
    id: string,
    asset: string,
    price: number;
    quantity: number;
    type: "limit" | "market";
    side: "taker" | "maker";
    filled_quantity: 0,
    status: "open" | "filled" | "cancelled";
    createdAt: Date,
    reason: "CREATE_ORDER";
} |
{
    userId: string,
    id: string,
    reason: "CANCEL_ORDER",
    asset: string,
    delta: number
}
