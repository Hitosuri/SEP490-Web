<script lang="ts">
	import 'nprogress/nprogress.css';
	import '../app.css';
	import 'svelte-reveal/styles.css';
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { Modal, initializeStores, storePopup } from '@skeletonlabs/skeleton';
	import { Toaster } from 'svelte-sonner';
	import nProgress from 'nprogress';
	import { navigating } from '$app/stores';

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
<Toaster position="top-center" richColors />
<slot />
