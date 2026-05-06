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
    price: number;
    time: Date;
    quantity: number;
    userid: ZodUUID;
}

type Book = { data: order[]; total_quantity: number };
type orderbook = Record<string, {bids: Book, asks: Book}>;


export const ORDERBOOK:orderbook = {
    AXIS: { bids: {} as Book, asks: {} as Book },
    HDFC: { bids: {} as Book, asks: {} as Book },
    TATA: { bids: {} as Book, asks: {} as Book },
    SOL: { bids: {} as Book, asks: {} as Book },
};


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
