import type { Request, Response } from "express";
import { SignupSchema } from "../models/signup";
import { check_zod } from "../lib/helpers";
import { prisma } from "../..";
import { hash } from "../services/hash";
import { BALANCES, USERS } from "../inmemory";

export async function SignupHandler(req: Request, res: Response) {
    // const { username, password } = req.body;
    // 1. check username not taken
    // 2. hash password (bcrypt/argon2)
    // 3. push to USERS
    // 4. init BALANCES[userId] with INR: { available: 0, locked: 0 }

    const result = SignupSchema.safeParse(req.body);
    const data = check_zod(result, res);

    // check existing user
    let user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    if (user) {
        return res.status(402).json({
            success: false,
            error: "User with email already exists, please login",
        });
    }

    // hash password
    data.password = await hash(data.password);

    const newUser = await prisma.user.create({
        data: data,
        select: {
            id: true,
            email: true,
            name: true
        }
    })

    USERS.push(newUser);
    BALANCES[newUser.id] = {
        INR: { available: 0, locked: 0 },
        USD: { available: 0, locked: 0 }
    };

    return res.status(201).json({
        success: true,
        data: newUser
    });
}
