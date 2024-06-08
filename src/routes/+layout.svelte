<script lang="ts">
	import 'nprogress/nprogress.css';
	import '../app.css';
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { Modal, initializeStores, storePopup } from '@skeletonlabs/skeleton';
	import { Toaster } from 'svelte-sonner';
	import type { LayoutData } from './$types';
	import userStore from '$lib/stores/user-store';
	import nProgress from 'nprogress';
	import { navigating } from '$app/stores';

	export let data: LayoutData;

	$: userStore.set(data.user);
	$: {
		if ($navigating) {
			nProgress.start();
		} else {
			nProgress.done();
		}
	}

	nProgress.configure({
		showSpinner: false
	});
	initializeStores();
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<Modal regionBackdrop="!bg-black/70" />
<Toaster />
<slot />
