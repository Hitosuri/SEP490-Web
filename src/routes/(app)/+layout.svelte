<script lang="ts">
	import { type SvelteEvent } from '@skeletonlabs/skeleton';
	import type { LayoutData } from './$types';
	import Header from '$lib/components/Header.svelte';

	export let data: LayoutData;

	function scrollHandler(e: SvelteEvent<UIEvent, Window>) {
		console.log(e.currentTarget.scrollY);
	}
</script>

<svelte:window />
<Header loginForm={data.loginForm} />
<div class="min-h-full h-full bg-white pt-[5.5rem]">
	<slot />
</div>
