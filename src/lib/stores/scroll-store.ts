import { writable } from 'svelte/store';

const scrollStore = writable<number>(0);

export default scrollStore;
