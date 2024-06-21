<script lang="ts">
	import LandingContent from '$lib/components/homepage/LandingContent.svelte';
	import Dashboard from '$lib/components/homepage/Dashboard.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

{#if data.user && !data.user.isPatient}
	<Dashboard />
{:else}
	<LandingContent />
{/if}
