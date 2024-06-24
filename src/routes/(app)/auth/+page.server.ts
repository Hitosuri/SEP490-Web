import { setError, superValidate } from 'sveltekit-superforms';
import type { Actions } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/form-schemas/login-schema';
import endpoints from '$lib/endpoints';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const cookieName = 'access-token';

export const actions: Actions = {
	login: async ({ request, cookies, url, fetch }) => {
		const form = await superValidate(request, zod(loginSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		if (!form.data.isUser && !z.string().email().safeParse(form.data.emailOrPhone).success) {
			setError(form, 'emailOrPhone', 'Đăng nhập với vai trò bệnh nhân chỉ được phép dùng email');
			return fail(400, { form });
		}

		try {
			let rielForm: Record<string, string>;
			if (form.data.isUser) {
				rielForm = {
					emailOrPhone: form.data.emailOrPhone,
					password: form.data.password
				};
			} else {
				rielForm = {
					email: form.data.emailOrPhone,
					password: form.data.password
				};
			}

			const response = await fetch(
				form.data.isUser ? endpoints.auth.loginUser : endpoints.auth.loginPatient,
				{
					method: 'POST',
					headers: {
						'content-type': 'application/json'
					},
					body: JSON.stringify(rielForm)
				}
			);

			const data = await response.json();
			console.log(data);
			

			if (!response.ok) {
				if (typeof data?.error === 'string') {
					form.message = data.error;
				} else if (Array.isArray(data?.error)) {
					form.message = data.error.join(', ');
				} else {
					form.message = 'Xảy ra lỗi khi đăng nhập';
				}
				return fail(response.status, { form });
			}

			const user = data.body;
			cookies.set(cookieName, user.token, {
				path: '/',
				expires: form.data.rememberMe ? new Date(user.expireAt) : undefined,
				secure: true
			});
		} catch (error) {
			console.log(error);
			return fail(500, { form });
		}

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
