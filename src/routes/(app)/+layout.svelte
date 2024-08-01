<script lang="ts">
	import { type SvelteEvent } from '@skeletonlabs/skeleton';
	import Header from '$lib/components/layout/Header.svelte';
	import scrollStore from '$lib/stores/scroll-store';
	import { getContext, setContext } from 'svelte';
	import { derived, writable, type Writable } from 'svelte/store';
	import SideBar from '$lib/components/layout/SideBar.svelte';
	import { page } from '$app/stores';

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	let sideBarOpenActive = writable(true);
	let sideBarOpened = derived([userStore, sideBarOpenActive], ([user, sideBarState]) => {
		return !!(user && !user.isPatient && sideBarState && !inAuth);
	});

	$: inLandingPage = $page.url.pathname;
	$: inAuth = $page.url.pathname.startsWith('/auth');

	setContext('sidebar-active', sideBarOpenActive);
	setContext('sidebar-state', sideBarOpened);

	function scrollHandler(e: SvelteEvent<UIEvent, Window>) {
		scrollStore.set(e.currentTarget.scrollY);
	}
</script>

<svelte:window on:scroll={scrollHandler} />
<div class="bg-stone-100 flex flex-row w-full">
	{#if $userStore && !$userStore.isPatient && !inAuth}
		<SideBar />
	{/if}
	<div class="relative flex-1 shrink-0">
		<Header />
		<div class="min-h-screen">
			<slot />
		</div>
	</div>
</div>
