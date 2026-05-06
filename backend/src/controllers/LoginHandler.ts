import type { Request, Response } from "express";
import { SigninSchema } from "../models/signin";
import { check_zod } from "../lib/helpers";
import { prisma } from "../..";
import { compare } from "../services/hash";
import { token } from "../middlewares/token";

export async function SigninHandler(req: Request, res: Response) {
    // 1. find user by username
    // 2. compare hashed password
    // 3. return JWT / session token

    const result = SigninSchema.safeParse(req.body);
    const data = check_zod(result, res);
    if (!data) {
        return;
    }

    // check if exists

    let user = await prisma.user.findUnique({
        where: {
            email: data.email
        }
    })

    if(!user || !(await compare(data.password,  user.password)))
    {
        return res.status(!user?404:401).json({
            success: false,
            error: !user? "User not found": "Invalid Credentials"
        })
    }

    return res.status(200).json({
        success: true,
        data: {
            token: token(user.email, user.id)
        }
    })
    
}