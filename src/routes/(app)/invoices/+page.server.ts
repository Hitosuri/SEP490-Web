import { filterRoles } from '$lib/helpers/authorization';
import endpoints from '$lib/endpoints';
import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { invoiceFilterSchema } from '$lib/form-schemas/invoice-filter-schema';
import { UserFeature, userFeatureDetails } from '$lib/constants/user-feature-constant';
import { handleFetch } from '$lib/helpers/utils';

export const load: PageServerLoad = async ({ fetch, url, locals }) => {
	filterRoles(locals, url, ...(userFeatureDetails[UserFeature.PAYMENT_MANAGEMENT].roles ?? []));

	const searchParams = new URLSearchParams();
	searchParams.set('page', '1');
	searchParams.set('size', '10');

	const requestUrl = `${endpoints.payment.get}?${searchParams}`;
	const r = await handleFetch(
		fetch(requestUrl, {
			headers: {
				Authorization: `Bearer ${locals.user?.token}`
			}
		})
	);

	const data: Pagination<Payment[]> = await r.json();

	data.data.forEach((x) => {
		x.examinationDate = new Date(x.examinationDate);
	});

	return {
		invoiceListPage: data,
		invoiceFilterForm: await superValidate(zod(invoiceFilterSchema))
	};
};
