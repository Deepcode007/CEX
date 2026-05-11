import { walletClient } from "../..";

export async function updateBalance(userId: string, asset: string, availableDelta: number, lockedDelta: number) {
    const key = `user:balance:${userId}`;
    
    // We use a transaction to update both at once
    await walletClient.multi()
        .hIncrByFloat(key, `${asset}_available`, availableDelta)
        .hIncrByFloat(key, `${asset}_locked`, lockedDelta)
        .exec();
}