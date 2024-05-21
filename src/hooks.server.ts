import { building, dev } from '$app/environment';
import jwtHandler from '$lib/middlewares/jwt-handler';
import { sequence } from '@sveltejs/kit/hooks';

if (dev && !building) {
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export const handle = sequence(jwtHandler);
