import { superValidate } from 'sveltekit-superforms';
import type { Actions } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/form-schemas/login-schema';
import endpoints from '$lib/endpoints';
import { fail, redirect } from '@sveltejs/kit';

const cookieName = 'access-token';

export const actions: Actions = {
	login: async ({ request, cookies, url }) => {
		const form = await superValidate(request, zod(loginSchema));
		try {
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
				if (Array.isArray(data) && data[0] === 'Username or password is wrong') {
					form.message = 'Sai mật khẩu hoặc tên đăng nhập';
				} else {
					form.message = 'Xảy ra lỗi khi đăng nhập';
				}
				return fail(response.status, { form });
			}

			cookies.set(cookieName, data.token, {
				path: '/',
				expires: form.data.rememberMe ? new Date(data.expireAt) : undefined,
				secure: true
			});

			const backPath = url.searchParams.get('backTo') || '/';

			redirect(301, backPath);
		} catch (error) {
			return fail(500, { form });
		}
	},
	logout: async ({ cookies }) => {
		cookies.set(cookieName, '', {
			path: '/',
			maxAge: 0
		});

		redirect(301, '/');
	}
};
