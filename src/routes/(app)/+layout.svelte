<script lang="ts">
	import { type SvelteEvent } from '@skeletonlabs/skeleton';
	import Header from '$lib/components/Header.svelte';

	// function scrollHandler(e: SvelteEvent<UIEvent, Window>) {
	// 	console.log(e.currentTarget.scrollY);
	// }
</script>

<div class="h-full bg-white">
	<Header />
	<div class="min-h-screen h-0">
		<slot />
	</div>
</div>
