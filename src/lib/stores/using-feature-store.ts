import type { UserFeature } from '$lib/constants/user-feature-constant';
import { writable } from 'svelte/store';

const usingFeature = writable<UserFeature | undefined>();

export default usingFeature;
