import { browser } from '$app/environment';
import userStore from '$lib/stores/user-store';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data }) => {
	if (browser) {
		userStore.set(data.user);
	}
	return {};
};
