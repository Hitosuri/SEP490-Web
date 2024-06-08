import { filterRoles, Role } from '$lib/authorization';
import endpoints from '$lib/endpoints';
import { editProfileSchema } from '$lib/form-schemas/edit-profile-schema';
import { message, superValidate } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	filterRoles(locals, url, Role.All);
	const response = await fetch(endpoints.profile.get, {
		headers: {
			Authorization: `Bearer ${locals.user?.token}`
		}
	});
	const profile: Profile = await response.json();
	profile.birthday = new Date(profile.birthday);
	return {
		profile
	};
};

export const actions: Actions = {
	editProfile: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(editProfileSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const response = await fetch(endpoints.profile.edit, {
				method: 'PUT',
				headers: {
					'content-type': 'application/json',
					Authorization: `Bearer ${cookies.get('access-token')}`
				},
				body: JSON.stringify(form.data)
			});

			if (!response.ok) {
				const result = (await response.text())?.trim();
				form.message = result || response.statusText;
				return fail(response.status, { form });
			} else {
				return message(form, 'Cập nhật profile thành công');
			}
		} catch (error) {
			console.log(error);
			return fail(500, { error: 'Đã có lỗi xảy ra' });
		}
	}
};
