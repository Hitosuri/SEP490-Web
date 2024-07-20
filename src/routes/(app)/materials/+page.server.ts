import { filterRoles, Role } from '$lib/authorization';
import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { materialFilterSchema } from '$lib/form-schemas/material-filter-schema';
import endpoints from '$lib/endpoints';
import { createMaterialSchema } from '$lib/form-schemas/create-material-schema';

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	filterRoles(locals, url, Role.Accountant);

	const response = await fetch(`${endpoints.materials.get}?page=1&size=10`, {
		headers: {
			Authorization: `Bearer ${locals.user?.token}`
		}
	});
	const materialListPage: Pagination<Material[]> = await response.json();

	return {
		materialFilterForm: await superValidate(zod(materialFilterSchema)),
		createMaterialForm: await superValidate(zod(createMaterialSchema)),
		materialListPage
	};
};
