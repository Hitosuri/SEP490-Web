import { UserFeature, userFeatureDetails } from '$lib/constants/user-feature-constant';
import { filterRoles } from '$lib/helpers/authorization';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	filterRoles(locals, url, ...(userFeatureDetails[UserFeature.STATISTIC].roles ?? []));
};
