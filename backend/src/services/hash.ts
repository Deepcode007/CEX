import bcrypt from "bcrypt";

export async function hash(password:string)
{
    return await bcrypt.hash(password, 10);
}