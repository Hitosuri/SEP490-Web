import { filterRoles, Role } from '$lib/authorization';
import endpoints from '$lib/endpoints';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	filterRoles(locals, url, Role.All);
	const response = await fetch(endpoints.profile.get, {
		headers: {
			Authorization: `Bearer ${locals.user?.token}`
		}
	});
	const profile: Profile = await response.json();
	profile.birthday = new Date(profile.birthday);
	return {
		profile
	};
};
