import { prisma } from "../../../backend";

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