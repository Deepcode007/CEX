import { walletClient } from "../..";

export async function getAssetBalance(userId: string, asset: string) {
    const fields = [`${asset}_available`, `${asset}_locked`];
    const [available, locked] = await walletClient.hmGet(`user:balance:${userId}`, fields);
    
    return {
        available: parseFloat(available || '0'),
        locked: parseFloat(locked || '0')
    };
}