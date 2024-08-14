import { filterRoles, Role } from '$lib/helpers/authorization';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	filterRoles(locals, url, Role.Admin);
};
