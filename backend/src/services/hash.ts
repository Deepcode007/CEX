import bcrypt from "bcrypt";

export async function hash(password:string)
{
    return await bcrypt.hash(password, 10);
}

export async function compare(password:string, encrypted:string)
{
    return await bcrypt.compare(password, encrypted);
}