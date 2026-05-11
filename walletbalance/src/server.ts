import { walletClient } from "..";

interface UserProfile {
    id: string;
    email: string;
}

async function getCachedUser(id: string): Promise<UserProfile | null> {
    const data = await walletClient.get(`user:${id}`);
    return data ? JSON.parse(data) as UserProfile : null;
}
