import zod from "zod";

export type StreamMessageReason = 
  | 'DEPOSIT'
  | 'FEE_DEDUCTION'
  | 'WITHDRAW'
  | 'PROCESS_ORDER';

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
    orderId: string,
    asset: string,
    delta: number,
    reason: "PROCESS_ORDER";
    createdAt: Date,
    side: "taker" | "maker",
    filled_quantity: number,
    quantity: number;
    price: number;
    type: "limit" | "market"
}
