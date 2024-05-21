<script lang="ts">
	import '../app.css';
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { Modal, initializeStores, storePopup } from '@skeletonlabs/skeleton';
	import { Toaster } from 'svelte-sonner';
	import type { LayoutData } from './$types';
	import userStore from '$lib/stores/user-store';

	export let data: LayoutData;

	$: userStore.set(data.user);

	initializeStores();
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<Modal regionBackdrop="!bg-black/70" />
<Toaster />
<slot />
