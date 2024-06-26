<script lang="ts">
	import LandingContent from '$lib/components/homepage/LandingContent.svelte';
	import Dashboard from '$lib/components/homepage/Dashboard.svelte';
	import { getContext } from 'svelte';
	import { type Writable } from 'svelte/store';

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
</script>

{#if $userStore && !$userStore.isPatient}
	<Dashboard />
{:else}
	<LandingContent />
{/if}
