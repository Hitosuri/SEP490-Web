<script lang="ts">
	import 'nprogress/nprogress.css';
	import '../app.css';
	import 'svelte-reveal/styles.css';
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { Modal, initializeStores, storePopup } from '@skeletonlabs/skeleton';
	import { Toaster } from 'svelte-sonner';
	import nProgress from 'nprogress';
	import { navigating } from '$app/stores';
	import { writable, type Writable } from 'svelte/store';
	import type { PageData } from './(app)/$types';
	import { setContext } from 'svelte';

	export let data: PageData;

	const userStore: Writable<UserBasic | undefined> = writable(data.user);

	$: {
		if ($navigating) {
			nProgress.start();
		} else {
			nProgress.done();
		}
	}
	$: userStore.set(data.user);

	setContext('user-store', userStore);
	nProgress.configure({
		showSpinner: false
	});
	initializeStores();
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<Modal
	regionBackdrop="!bg-black/80"
	buttonTextCancel="Huỷ"
	buttonTextConfirm="Xác nhận"
	buttonPositive="font-semibold hover:underline"
	buttonNeutral="variant-filled-primary"
/>
<Toaster position="top-center" richColors />
<slot />
