import { filterRoles, Role } from '$lib/authorization';
import endpoints from '$lib/endpoints';
import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { invoiceFilterSchema } from '$lib/form-schemas/invoice-filter-schema';

export const load: PageServerLoad = async ({ fetch, url, locals }) => {
	filterRoles(locals, url, Role.Accountant, Role.Recieptionist);

	const searchParams = new URLSearchParams();
	searchParams.set('page', '1');
	searchParams.set('size', '10');

	const requestUrl = `${endpoints.payment.get}?${searchParams}`;
	const r = await fetch(requestUrl, {
		headers: {
			Authorization: `Bearer ${locals.user?.token}`
		}
	});

	const data: Pagination<Payment[]> = await r.json();

	data.data.forEach((x) => {
		x.examinationDate = new Date(x.examinationDate);
	});

	return {
		invoiceListPage: data,
		invoiceFilterForm: await superValidate(zod(invoiceFilterSchema))
	};
};
