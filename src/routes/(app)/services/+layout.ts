import type { LayoutLoad } from './$types';
import usingFeature from '$lib/stores/using-feature-store';
import { UserFeature } from '$lib/constants/user-feature-constant';
import { browser } from '$app/environment';

export const load: LayoutLoad = async () => {
	if (browser) {
		usingFeature.set(UserFeature.SERVICES_MANAGEMENT);
	}
};
