import { filterRoles, Role } from '$lib/authorization';
import { fail, message, superValidate } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { userFilterSchema } from '$lib/form-schemas/user-filter-schema';
import endpoints from '$lib/endpoints';
import { createUserSchema } from '$lib/form-schemas/create-user-schema';
import { editUserSchema } from '$lib/form-schemas/edit-user-schema';
import { getRoleId } from '$lib/helpers/utils';

export const load: PageServerLoad = async ({ locals, url }) => {
	filterRoles(locals, url, Role.Admin);
	const response = await fetch(endpoints.users.get, {
		headers: {
			Authorization: `Bearer ${locals.user?.token}`
		}
	});
	const userListPage: Pagination<User[]> = await response.json();
	userListPage.data.forEach((x) => {
		x.birthday = new Date(x.birthday);
	});
	return {
		userFilterForm: await superValidate(zod(userFilterSchema)),
		createUserForm: await superValidate(zod(createUserSchema)),
		editUserForm: await superValidate(zod(editUserSchema)),
		userListPage
	};
};

export const actions: Actions = {
	createUser: async ({ request, cookies, fetch }) => {
		const form = await superValidate(request, zod(createUserSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const { roles, ...others } = form.data;
			const rielForm: Record<string, string | number[] | number | Date> = { ...others };
			rielForm.roleIds = roles.map(getRoleId).filter((x) => x !== 0);

			const response = await fetch(endpoints.users.create, {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					Authorization: `Bearer ${cookies.get('access-token')}`
				},
				body: JSON.stringify(rielForm)
			});

			if (!response.ok) {
				const result = (await response.text())?.trim();
				try {
					const feedback = JSON.parse(result);
					console.log(feedback);
				} catch (error) {
					console.log(result);
				}

				form.message = result || response.statusText;
				return fail(response.status, { form });
			} else {
				return message(form, 'Tạo nhân viên thành công');
			}
		} catch (error) {
			console.log(error);
			form.message = 'Đã có lỗi xảy ra';
			return fail(500, { form });
		}
	},
	editUser: async ({ request, cookies, fetch }) => {
		const form = await superValidate(request, zod(editUserSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// TODO incomplete because password is required and user list missing birthday
			const { roles, ...others } = form.data;
			const rielForm: Record<string, string | boolean | number | number[]> = { ...others };
			rielForm.roleIds = roles.map(getRoleId).filter((x) => x !== 0);
			console.log(JSON.stringify(rielForm, null, 2));

			const response = await fetch(endpoints.users.edit(form.data.id), {
				method: 'PUT',
				headers: {
					'content-type': 'application/json',
					Authorization: `Bearer ${cookies.get('access-token')}`
				},
				body: JSON.stringify(rielForm)
			});

			if (!response.ok) {
				const result = (await response.text())?.trim();
				try {
					const feedback = JSON.parse(result);
					console.log(feedback);
				} catch (error) {
					console.log(result);
				}

				form.message = result || response.statusText;
				return fail(response.status, { form });
			}

			return message(form, 'Tạo nhân viên thành công');
		} catch (error) {
			console.log(error);
			form.message = 'Đã có lỗi xảy ra';
			return fail(500, { form });
		}
	}
};
