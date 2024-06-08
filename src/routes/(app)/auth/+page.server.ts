import { superValidate } from 'sveltekit-superforms';
import type { Actions } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/form-schemas/login-schema';
import endpoints from '$lib/endpoints';
import { error, redirect } from '@sveltejs/kit';

const cookieName = 'access-token';

export const actions: Actions = {
	login: async ({ request, cookies, url }) => {
		const form = await superValidate(request, zod(loginSchema));

		const response = await fetch(endpoints.auth.login, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				userName: form.data.userName,
				password: form.data.password
			})
		});

		const data = await response.json();

		if (!response.ok) {
			error(response.status, data);
		}

		cookies.set(cookieName, data.token, {
			path: '/',
			expires: form.data.rememberMe ? new Date(data.expireAt) : undefined,
			secure: true
		});

		const backPath = url.searchParams.get('backTo') || '/';

		redirect(301, backPath);
	},
	logout: async ({ cookies }) => {
		cookies.set(cookieName, '', {
			path: '/',
			maxAge: 0
		});

		redirect(301, '/');
	}
};
