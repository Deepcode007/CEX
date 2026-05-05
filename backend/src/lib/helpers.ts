import type { Response } from "express";
import type { ZodSafeParseResult } from "zod";

export function check_zod<T>(result: ZodSafeParseResult<T>, res: Response): T | undefined {
    if (result.success) {
        return result.data;
    }

    const allMessages = result.error.issues.map((issue) => issue.message);
    res.status(401).json({
        success: false,
        error: allMessages.length > 0 ? allMessages : "Invalid Input Schema",
    });
}
