import { filterRoles, Role } from '$lib/authorization';
import { createAppointmentSchema } from '$lib/form-schemas/create-appointment-schema';
import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import endpoints from '$lib/endpoints';

export const load: PageServerLoad = async ({ locals, url }) => {
	filterRoles(locals, url, Role.All);
	const today = new Date();

	const searchParams = new URLSearchParams();
	searchParams.set('page', '1');
	searchParams.set('size', '1000');
	searchParams.set('startAt', `${today.getFullYear()}-${today.getMonth() + 1}-1`);
	searchParams.set('endAt', `${today.getFullYear()}-${today.getMonth() + 2}-1`);

	const r = await fetch(`${endpoints.schedule.getByRecieptionist}?${searchParams}`, {
		headers: {
			Authorization: `Bearer ${locals.user?.token}`
		}
	});

	const schedules: Pagination<ScheduleByRecieptionist[]> = await r.json();
	schedules.data.forEach((x) => {
		x.startAt = new Date(x.startAt);
		x.endAt = new Date(x.endAt);
	});

	return {
		createAppointmentForm: await superValidate(zod(createAppointmentSchema)),
		schedules: schedules
	};
};
