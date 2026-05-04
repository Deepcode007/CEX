import jwt, { type Secret } from "jsonwebtoken";
const secret = process.env.JWT_KEY as Secret;


export function token(email: string, id: string) {
	const token = jwt.sign({
		email: email,
		id: id
	}, secret);
	return token;
}