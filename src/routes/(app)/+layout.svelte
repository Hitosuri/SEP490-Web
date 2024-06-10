<script lang="ts">
	import { type SvelteEvent } from '@skeletonlabs/skeleton';
	import Header from '$lib/components/Header.svelte';
	import scrollStore from '$lib/stores/scroll-store';

	function scrollHandler(e: SvelteEvent<UIEvent, Window>) {
		scrollStore.set(e.currentTarget.scrollY);
	}
</script>

<svelte:window on:scroll={scrollHandler} />
<div class="h-full bg-white relative">
	<Header />
	<div class="min-h-screen h-screen">
		<slot />
	</div>
</div>
