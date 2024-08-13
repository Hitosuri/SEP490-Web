import { filterRoles, Role } from '$lib/helpers/authorization';
import endpoints from '$lib/endpoints';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { editPrescriptionDetailSchema } from '$lib/form-schemas/edit-prescription-detail-schema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { editRecordSchema } from '$lib/form-schemas/edit-record-schema';
import { UserFeature, userFeatureDetails } from '$lib/constants/user-feature-constant';

export const load: PageServerLoad = async ({ locals, url, params, fetch }) => {
	filterRoles(
		locals,
		url,
		...(userFeatureDetails[UserFeature.PATIENTS_MANAGEMENT].roles ?? []),
		Role.Patient
	);

	const recordId = Number(params.id);
	if (!recordId) {
		error(400, { message: 'Id của bệnh nhân phải là số' });
	}

	const r = await fetch(endpoints.records.detail(recordId), {
		headers: {
			Authorization: `Bearer ${locals.user?.token}`
		}
	});

	if (!r.ok) {
		if (r.status === 404) {
			error(404, { message: 'Hồ sơ không tồn tại' });
		} else {
			error(r.status, { message: await r.text() });
		}
	}

	const recordData: ApiResponse<RecordPatient> = await r.json();

	if (!recordData.body) {
		error(500, { message: 'Đã có lỗi xảy ra' });
	}

	let prescription: Prescription | undefined;

	if (recordData.body.prescriptionId) {
		const r2 = await fetch(endpoints.prescriptions.get(recordData.body.prescriptionId), {
			headers: {
				Authorization: `Bearer ${locals.user?.token}`
			}
		});

		const prescriptionData: ApiResponse<Prescription> = await r2.json();
		prescription = prescriptionData.body!;
		prescription.indication = prescription.indication === '-' ? '' : prescription.indication;
	}

	let prefetchExtraMaterials: Material[] = [];

	if (recordData.body.extraMaterials.length > 0) {
		const searchParams = new URLSearchParams();
		searchParams.set('page', '1');
		searchParams.set('size', String(recordData.body.extraMaterials.length));
		recordData.body.extraMaterials.forEach((x) => {
			searchParams.append('includeIds', String(x.materialId));
		});
		const r3 = await fetch(`${endpoints.materials.get}?${searchParams}`, {
			headers: {
				Authorization: `Bearer ${locals.user?.token}`
			}
		});
		const data: Pagination<Material[]> = await r3.json();
		prefetchExtraMaterials = data.data;
	}

	return {
		record: recordData.body,
		prescription,
		editPrescriptionDetailForm: await superValidate(zod(editPrescriptionDetailSchema)),
		editRecordForm: await superValidate(zod(editRecordSchema)),
		recordId: recordId,
		prefetchExtraMaterials
	};
};
