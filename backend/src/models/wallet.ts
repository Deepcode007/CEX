import zod from "zod";

export const WalletSchema = zod.object({
    asset: zod.string()
})