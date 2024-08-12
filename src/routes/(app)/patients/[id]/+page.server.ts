import { filterRoles, Role } from '$lib/helpers/authorization';
import endpoints from '$lib/endpoints';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { editPatientSchema } from '$lib/form-schemas/edit-patient-schema';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms';

export const load: PageServerLoad = async ({ locals, url, params, fetch }) => {
	filterRoles(locals, url, Role.Doctor);
	const patientId = Number(params.id);
	if (!patientId) {
		error(400, { message: 'Id của bệnh nhân phải là số' });
	}

	const [patient, records] = await Promise.all([
		fetch(`${endpoints.patients.detail(patientId)}`, {
			headers: {
				Authorization: `Bearer ${locals.user?.token}`
			}
		}).then<ApiResponse<Patient>>((x) => x.json()),
		fetch(`${endpoints.records.get(patientId)}`, {
			headers: {
				Authorization: `Bearer ${locals.user?.token}`
			}
		}).then<ApiResponse<RecordListItem[]>>((x) => x.json())
	]);

	if (patient.status === 404) {
		error(404, {
			message: patient.error ?? ''
		});
	}

	if (!patient.body || !records.body) {
		error(500, {
			message: 'Đã có lỗi xảy ra'
		});
	}

	patient.body.birthday = patient.body.birthday
		? new Date(patient.body.birthday)
		: patient.body.birthday;
	records.body.forEach((x) => {
		x.visitDate = new Date(x.visitDate);
	});

	return {
		patient: patient.body,
		records: records.body,
		editPatientForm: await superValidate(zod(editPatientSchema))
	};
};
