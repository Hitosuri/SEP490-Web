import endpoints from '$lib/endpoints';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	let errorMsg = '';
	let confirmed = false;

	if (!params.token.at(-1)) {
		errorMsg = 'Token không hợp lệ';
	}

	if (!errorMsg) {
		if (params.token.at(-1) === ';') {
			confirmed = true;
		}

		const token = params.token.slice(0, -1);
		const url = endpoints.schedule.confirmFromPatient(token, confirmed);

		const response = await fetch(url, {
			method: 'PUT'
		});

		if (!response.ok) {
			errorMsg = (await response.text()) || 'Đã có lỗi xảy ra';
		}
	}

	return {
		errorMsg,
		confirmed
	};
};
