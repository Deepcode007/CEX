import type { Response } from "express";
import type { ZodSafeParseResult } from "zod";

export function check_zod<T>(result: ZodSafeParseResult<T>, res: Response): T {
    if (!result.success) {
        const allMessages = result.error.issues.map((issue) => issue.message);
        throw new Error("Error is")
    }

    return result.data
}
