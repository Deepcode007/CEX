import zod from "zod";

export const OrderSchema = zod.object({
    side: zod.enum(["BUY", "SELL"]),
    type: zod.enum(["LIMIT", "MARKET"]),
    symbol: zod.string().uppercase(),
    price: zod.number(),
    quantity: zod.number()
})