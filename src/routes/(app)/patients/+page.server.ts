import { filterRoles, Role } from '$lib/authorization';
import endpoints from '$lib/endpoints';
import { createPatientSchema } from '$lib/form-schemas/create-patient-schema';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	filterRoles(locals, url, Role.Doctor, Role.Nurse);

	const response = await fetch(`${endpoints.patients.get}?page=1&size=10`, {
		headers: {
			Authorization: `Bearer ${locals.user?.token}`
		}
	});
	const patientListPage: Pagination<Patient[]> = await response.json();

	patientListPage.data.forEach((x) => {
		x.birthday = x.birthday ? new Date(x.birthday) : x.birthday;
	});

	return {
		patientListPage,
		createPatientForm: await superValidate(zod(createPatientSchema))
	};
};
