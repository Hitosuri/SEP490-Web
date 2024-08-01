import { writable } from 'svelte/store';

const usingSubFeature = writable<[UserSubFeatureDetail] | undefined>();

export default usingSubFeature;
