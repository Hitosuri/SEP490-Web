import { browser } from '$app/environment';
import { UserFeature } from '$lib/constants/user-feature-constant';
import usingFeature from '$lib/stores/using-feature-store';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	if (browser) {
		usingFeature.set(UserFeature.SCHEDULE_MANAGEMENT);
	}
};
