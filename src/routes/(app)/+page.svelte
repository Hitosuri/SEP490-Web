<script lang="ts">
	import LandingContent from '$lib/components/homepage/LandingContent.svelte';
	import Dashboard from '$lib/components/homepage/Dashboard.svelte';
	import userStore from '$lib/stores/user-store';
	import { Role } from '$lib/authorization';
</script>

{#if $userStore && $userStore.role !== Role.Patient}
	<Dashboard />
{:else}
	<LandingContent />
{/if}
