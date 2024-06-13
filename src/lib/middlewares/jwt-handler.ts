import { JWT_ACCESS_KEY } from '$env/static/private';
import type { Handle } from '@sveltejs/kit';
import { jwtVerify } from 'jose';
import { JWSSignatureVerificationFailed, JWTExpired } from 'jose/errors';

const jwtHandler: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('access-token');

	if (token) {
		try {
			const payload = await verifyJwt(token);
			event.locals.user = {
				email: payload.sub,
				userId: payload.userId,
				role: typeof payload.role === 'string' ? [payload.role] : payload.role,
				uid: payload.jti,
				token
			};
		} catch (error) {
			console.log(error);
		}
	}

	return await resolve(event);
};

export default jwtHandler;

async function verifyJwt(token: string): Promise<JwtPayload> {
	try {
		const result = await jwtVerify(token, new TextEncoder().encode(JWT_ACCESS_KEY));
		return result.payload as unknown as JwtPayload;
	} catch (error) {
		if (error instanceof JWSSignatureVerificationFailed) {
			throw 'Token không hợp lệ';
		}
		if (error instanceof JWTExpired) {
			throw 'Token đã hết hạn';
		}
		console.log(error);
		throw error;
	}
}
