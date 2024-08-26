import { filterRoles, Role } from '$lib/helpers/authorization';
import endpoints from '$lib/endpoints';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { editPrescriptionDetailSchema } from '$lib/form-schemas/edit-prescription-detail-schema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { editRecordSchema } from '$lib/form-schemas/edit-record-schema';
import { UserFeature, userFeatureDetails } from '$lib/constants/user-feature-constant';
import { handleFetch } from '$lib/helpers/utils';
import { RecordStatus } from '$lib/constants/record-constant';

export const load: PageServerLoad = async ({ locals, url, params, fetch }) => {
	filterRoles(
		locals,
		url,
		...(userFeatureDetails[UserFeature.PATIENTS_MANAGEMENT].roles?.filter(
			(x) => x !== Role.Recieptionist
		) ?? []),
		Role.Patient
	);

	const recordId = Number(params.id);
	if (!recordId) {
		error(400, { message: 'Id của bệnh nhân phải là số' });
	}

	const r = await handleFetch(
		fetch(endpoints.records.detail(recordId), {
			headers: {
				Authorization: `Bearer ${locals.user?.token}`
			}
		}),
		{ 404: 'Không lấy được thông tin về bệnh án' }
	);

	const recordData: ApiResponse<RecordPatient> = await r.json();

	if (!recordData.body) {
		error(500, { message: 'Đã có lỗi xảy ra' });
	}

	const [prescription, prefetchExtraMaterials] = await Promise.all([
		recordData.body.prescriptionId
			? handleFetch(
					fetch(endpoints.prescriptions.get(recordData.body.prescriptionId), {
						headers: {
							Authorization: `Bearer ${locals.user?.token}`
						}
					})
				)
					.then<ApiResponse<Prescription>>((r) => r.json())
					.then((data) => {
						if (!data.body) {
							error(500, { message: 'Không lấy được thông tin về đơn thuốc' });
						}

						data.body.indication = data.body.indication === '-' ? '' : data.body.indication;
						return data.body;
					})
			: Promise.resolve(undefined),
		!locals.user?.isPatient &&
		recordData.body.extraMaterials.length > 0 &&
		recordData.body.status === RecordStatus.PROCESSING
			? handleFetch(
					(() => {
						const searchParams = new URLSearchParams();
						searchParams.set('page', '1');
						searchParams.set('size', String(recordData.body.extraMaterials.length));
						recordData.body.extraMaterials.forEach((x) => {
							searchParams.append('includeIds', String(x.materialId));
						});
						return fetch(`${endpoints.materials.get}?${searchParams}`, {
							headers: {
								Authorization: `Bearer ${locals.user?.token}`
							}
						});
					})()
				)
					.then<Pagination<Material[]>>((r) => r.json())
					.then((data) => data.data)
			: Promise.resolve([])
	]);

	return {
		record: recordData.body,
		prescription,
		editPrescriptionDetailForm: await superValidate(zod(editPrescriptionDetailSchema)),
		editRecordForm: await superValidate(zod(editRecordSchema)),
		recordId: recordId,
		prefetchExtraMaterials
	};
};
