import zod from "zod";

export const OrderSchema = zod.object({
    side: zod.enum(["buy", "sell"]),
    type: zod.enum(["limit", "market"]),
    symbol: zod.string().uppercase(),
    price: zod.number().gt(0),
    quantity: zod.number().gt(0)
});
