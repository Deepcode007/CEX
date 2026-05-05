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
export const ORDERBOOK = {
    AXIS: { bids: {}, asks: {} },
    HDFC: { bids: {}, asks: {} },
    TATA: { bids: {}, asks: {} },
};
