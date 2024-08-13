import { filterRoles, Role } from '$lib/helpers/authorization';
import endpoints from '$lib/endpoints';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { handleFetch } from '$lib/helpers/utils';

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	filterRoles(locals, url, Role.All);

	let profile: Profile;
	let records: RecordListItem[] | undefined;

	if (locals.user?.isPatient) {
		const [profileData, recordsData] = await Promise.all([
			handleFetch(
				fetch(endpoints.profile.getByPatient, {
					headers: {
						Authorization: `Bearer ${locals.user?.token}`
					}
				})
			).then<ApiResponse<Profile>>((x) => x.json()),
			handleFetch(
				fetch(`${endpoints.records.get(locals.user.id)}`, {
					headers: {
						Authorization: `Bearer ${locals.user?.token}`
					}
				})
			).then<ApiResponse<RecordListItem[]>>((x) => x.json())
		]);

		if (!profileData.body || !recordsData.body) {
			error(500);
		}

		profileData.body.birthday = new Date(profileData.body.birthday);
		profile = profileData.body;
		recordsData.body.forEach((x) => {
			x.visitDate = new Date(x.visitDate);
		});
		records = recordsData.body;
	} else {
		const response = await handleFetch(
			fetch(endpoints.profile.getByUser, {
				headers: {
					Authorization: `Bearer ${locals.user?.token}`
				}
			})
		);
		const data: Profile = await response.json();

		data.birthday = new Date(data.birthday);
		profile = data;
	}

	return {
		profile,
		records
	};
};
