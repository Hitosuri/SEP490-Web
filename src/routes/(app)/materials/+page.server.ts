import { filterRoles } from '$lib/helpers/authorization';
import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { materialFilterSchema } from '$lib/form-schemas/material-filter-schema';
import endpoints from '$lib/endpoints';
import { createMaterialSchema } from '$lib/form-schemas/create-material-schema';
import { materialTypeCreateSchema } from '$lib/form-schemas/material-type-create-schema';
import { createSupplierSchema } from '$lib/form-schemas/create-supplier-schema';
import { importMaterialSchema } from '$lib/form-schemas/import-material-schema';
import { createExportMaterialSchema } from '$lib/form-schemas/create-export-material-schema';
import { editExportMaterialSchema } from '$lib/form-schemas/edit-export-material-schema';
import { UserFeature, userFeatureDetails } from '$lib/constants/user-feature-constant';
import { handleFetch } from '$lib/helpers/utils';
import { importMaterialFilterSchema } from '$lib/form-schemas/import-material-filter-schema';

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	filterRoles(locals, url, ...(userFeatureDetails[UserFeature.MATERIALS_MANAGEMENT].roles ?? []));

	const response = await handleFetch(
		fetch(`${endpoints.materials.get}?page=1&size=10`, {
			headers: {
				Authorization: `Bearer ${locals.user?.token}`
			}
		})
	);
	const materialListPage: Pagination<Material[]> = await response.json();

	return {
		materialFilterForm: await superValidate(zod(materialFilterSchema)),
		createMaterialForm: await superValidate(zod(createMaterialSchema)),
		materialTypeCreateForm: await superValidate(zod(materialTypeCreateSchema)),
		createSupplierForm: await superValidate(zod(createSupplierSchema)),
		importMaterialForm: await superValidate(zod(importMaterialSchema)),
		createExportMaterialForm: await superValidate(zod(createExportMaterialSchema)),
		editExportMaterialForm: await superValidate(zod(editExportMaterialSchema)),
		importMaterialFilterForm: await superValidate(zod(importMaterialFilterSchema)),
		materialListPage
	};
};
