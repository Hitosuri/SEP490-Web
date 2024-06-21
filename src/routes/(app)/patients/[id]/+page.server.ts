import { filterRoles, Role } from '$lib/authorization';
import endpoints from '$lib/endpoints';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { editPatientSchema } from '$lib/form-schemas/edit-patient-schema';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	filterRoles(locals, url, [Role.Doctor, Role.Nurse]);
	const patientId = Number(params.id);
	if (!patientId) {
		error(400, { message: 'Id của bệnh nhân phải là số' });
	}

	const response = await fetch(`${endpoints.patients.detail(patientId)}`, {
		headers: {
			Authorization: `Bearer ${locals.user?.token}`
		}
	});
	const data: ApiResponse<Patient> = await response.json();

	if (!response.ok || data.status >= 400) {
		error(response.status >= 400 ? response.status : data.status, { message: data.error ?? '' });
	} else if (!data.body) {
		error(500);
	}

	data.body.birthday = data.body.birthday ? new Date(data.body.birthday) : data.body.birthday;

	return {
		patient: data.body,
		editPatientForm: await superValidate(zod(editPatientSchema))
	};
};
