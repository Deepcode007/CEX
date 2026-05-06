import zod, { ZodUUID } from "zod";

// --- In-memory state ---
export const USERS: { email: string; name: string; id: string }[] = [];
export const STOCKS = [
    { id: 1, title: "AXIS BANK", symbol: "AXIS" },
    { id: 2, title: "HDFC BANK", symbol: "HDFC" },
    { id: 3, title: "SOLANA", symbol: "SOL" },
    { id: 4, title: "ETHERIUM", symbol: "ETH" },
];

export type AssetBalance = {
    available: number;
    locked: number;
};

export type UserBalances = Record<string, AssetBalance>;

export type Balances = Record<string, UserBalances>;

export const ORDERS = [];
export const FILLS = [];
export const BALANCES: Balances = {}; // { userId: { INR: {available, locked}, AXIS: {available, locked}, ... } }

// ***************** Order Book ***************** //
interface order {
    quantity: number;
    time: Date;
    userid: ZodUUID;
}

type Book = Record<number, { data: order[]; total_quantity: number }>;

export const ORDERBOOK = {
    AXIS: { bids: {} as Book, asks: {} as Book },
    HDFC: { bids: {} as Book, asks: {} as Book },
    TATA: { bids: {} as Book, asks: {} as Book },
    SOL: { bids: {} as Book, asks: {} as Book },
};

/*
bids:{
price:number(eg. 67.67): {
    data: [
            {
                quantity: 10.5,
                time: 12:40:10,
                userid:1
            },
            {
                quantity: 4.5,
                time: 12:40:12,
                userid:2
            },
            {
                quantity: 5,
                time: 12:40:30,
                userid:3
            },
        ],
    total_quantity: 20
}

}

*/
