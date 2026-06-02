import zod from "zod";

export const EngineRequestSchema = zod.object({
    id: zod.uuid(),
    responseQueue: zod.string(),
    type: zod.enum(["create_order", "get_depth", "get_user_balance", "get_order", "cancel_order", "deposit", "withdraw"]),
    order: zod.record(zod.any(), zod.any())
})
