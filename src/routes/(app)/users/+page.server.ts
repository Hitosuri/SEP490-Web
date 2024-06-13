import { filterRoles, Role } from '$lib/authorization';
import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { userFilterSchema } from '$lib/form-schemas/user-filter-schema';
import endpoints from '$lib/endpoints';

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
		userListPage
	};
};
