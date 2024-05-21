import { filterRoles, Role } from '$lib/authorization';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	filterRoles(locals, url, { exclude: [Role.All] });
};
