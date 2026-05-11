import { walletClient } from "../..";

export async function initUserWallet(userId: string, asset: string, initialAmount: number) {
    const key = `user:balance:${userId}`;
    
    await walletClient.hSet(key, {
        [`${asset}_available`]: initialAmount.toString(),
        [`${asset}_locked`]: "0"
    });
}