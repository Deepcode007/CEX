import zod, { ZodUUID } from "zod";
import type { Balances, Orders } from "./types/inmemoryTypes";
import { prisma } from "..";

// --- In-memory state ---
export const USERS: { email: string; name: string; id: string }[] = [];
export let STOCKS = new Map<string, boolean>

let arr = await prisma.stock.findMany();

for (let i of arr)
{
    STOCKS.set(i.symbol, true);
}



export const ORDERS:Orders[] = [];
export const FILLS = [];
export const BALANCES: Balances = {}; // { userId: { INR: {available, locked}, AXIS: {available, locked}, ... } }

// ***************** Order Book ***************** //
export interface order {
    price: number;
    time: Date;
    quantity: number;
    userid: ZodUUID;
}

type Book = { data: order[]; total_quantity: number };
type orderbook = Record<string, {bids: Book, asks: Book}>;



/*
bids:{
    data: [
            {
                quantity: 10.5,
                time: 12:40:10,
                userid:1,
                price: 100
            },
            {
                quantity: 4.5,
                time: 12:40:12,
                userid:2,
                price: 101
            },
            {
                quantity: 5,
                time: 12:40:30,
                userid:3,
                price: 90
            },
        ],
    total_quantity: 20
}

}

*/
