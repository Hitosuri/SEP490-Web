import { filterRoles, Role } from '$lib/authorization';
import { createAppointmentSchema } from '$lib/form-schemas/create-appointment-schema';
import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ locals, url }) => {
	filterRoles(locals, url, Role.All);
	return {
		createAppointmentForm: await superValidate(zod(createAppointmentSchema))
	};
};
