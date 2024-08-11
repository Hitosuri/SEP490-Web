import { filterRoles, Role } from '$lib/authorization';
import endpoints from '$lib/endpoints';
import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { treatmentFilterSchema } from '$lib/form-schemas/treatment-filter-schema';
import { createTreatmentSchema } from '$lib/form-schemas/create-treatment-schema';

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	filterRoles(locals, url, Role.Doctor);

	const searchParams = new URLSearchParams();
	searchParams.set('page', '1');
	searchParams.set('size', '10');

	const requestUrl = `${endpoints.treatments.get}?${searchParams}`;
	const r = await fetch(requestUrl, {
		headers: {
			Authorization: `Bearer ${locals.user?.token}`
		}
	});

	const data: ApiResponse<Pagination<Treatment[]>> = await r.json();

	return {
		treatmentListPage: data.body!,
		treatmentFilterForm: await superValidate(zod(treatmentFilterSchema)),
		createTreatmentForm: await superValidate(zod(createTreatmentSchema))
	};
};
