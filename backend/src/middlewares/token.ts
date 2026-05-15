import jwt, { type Secret } from "jsonwebtoken";
// import { env } from "../config/env";
const secret = Bun.env.JWT_KEY as string;


export function create_token(email: string, id: string) {
	const token = jwt.sign({
		email: email,
		id: id
	}, secret);
	return token;
}