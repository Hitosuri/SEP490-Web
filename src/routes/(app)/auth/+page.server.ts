import { superValidate } from 'sveltekit-superforms';
import type { Actions } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/form-schemas/login-schema';
import endpoints from '$lib/endpoints';
import { fail, redirect } from '@sveltejs/kit';

const cookieName = 'access-token';

export const actions: Actions = {
	login: async ({ request, cookies, url, fetch }) => {
		const form = await superValidate(request, zod(loginSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const rielForm = {
				emailOrPhone: form.data.emailOrPhone,
				password: form.data.password
			};

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

			const bodyText = await response.text();

			if (!response.ok) {
				try {
					const data = JSON.parse(bodyText);
					if (typeof data?.error === 'string') {
						form.message = data?.error;
					} else if (Array.isArray(data?.error) || Array.isArray(data)) {
						form.message = (data?.error ?? data).join(', ');
					} else if (typeof data.errors === 'object' || typeof data === 'object') {
						form.message = Object.values(data.errors ?? data).join(', ');
					}
				} catch (error) {
					form.message = 'Xảy ra lỗi khi đăng nhập';
				}
				return fail(response.status, { form });
			}

			const data = JSON.parse(bodyText);
			const user = data.body;
			cookies.set(cookieName, user.token, {
				path: '/',
				expires: form.data.rememberMe ? new Date(user.expireAt) : undefined,
				secure: true
			});
		} catch (error) {
			if (error instanceof Error && error.message === 'fetch failed') {
				form.message =
					'Không kết nối được tới máy chú, vui lòng kiểm tra kết nối mạng hoặc thử lại sau';
			}

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
