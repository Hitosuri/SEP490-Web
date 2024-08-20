import endpoints from '$lib/endpoints';
import { filterRoles, Role } from '$lib/helpers/authorization';
import { handleFetch } from '$lib/helpers/utils';
import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { applicationFilterSchema } from '$lib/form-schemas/application-filter-schema';

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	filterRoles(locals, url, Role.All);

	const searhcParams = new URLSearchParams();
	searhcParams.set('page', '1');
	searhcParams.set('size', '10');

	const r = await handleFetch(
		fetch(`${endpoints.application.getByAdmin}?${searhcParams}`, {
			headers: {
				Authorization: `Bearer ${locals.user?.token}`
			}
		})
	);
	const data: Pagination<Application[]> = await r.json();

	data.data.forEach((x) => {
		x.startAt = new Date(x.startAt);
		x.endAt = new Date(x.endAt);
	});

	return {
		applicationListPage: data,
		applicationFilterForm: await superValidate(zod(applicationFilterSchema))
	};
};
