import { writable, type Writable } from 'svelte/store';

const userStore: Writable<UserBasic | undefined> = writable(undefined);

export default userStore;
