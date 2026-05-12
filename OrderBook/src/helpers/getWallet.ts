import { prisma } from "../../../backend";

// for 1st time when user login 
export async function getWallet(userId: string, asset: string)
{
    let wallet = await prisma.wallet.findUnique({
        where: {
            userid_asset: {
                userid: userId,
                asset: asset
            }
        }
    })

    return wallet;
}

export async function getAllWallet(userId: string)
{
    let wallet = await prisma.wallet.findMany({
        where: {
            userid: userId
        }
    })

    return wallet;
}