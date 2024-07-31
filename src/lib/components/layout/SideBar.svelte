<script lang="ts">
	import { userFeatureDetails } from '$lib/constants/user-feature-constant';
	import usingFeature from '$lib/stores/using-feature-store';
	import { getContext } from 'svelte';
	import type { Readable, Writable } from 'svelte/store';

	const allFeature = Object.values(userFeatureDetails);
	let sideBarOpenActive = getContext<Writable<boolean>>('sidebar-active');
	let sideBarOpened = getContext<Readable<boolean>>('sidebar-state');
	let searchInput = '';

	$: normalizedSearchInput = searchInput
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '');
	$: filteredFeatures = allFeature.filter((x) =>
		x.title
			.toLowerCase()
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.includes(normalizedSearchInput)
	);
</script>

<div
	class="relative h-auto shrink-0 transition-all duration-300 ease-out w-side-bar {$sideBarOpened
		? 'ml-0'
		: '-ml-side-bar'}"
>
	<div class="sticky top-0 right-0 w-side-bar bg-white border-r h-screen z-20">
		<div class="p-6">
			<div class="h-10 flex items-center justify-between">
				<a href="/">
					<img class="h-12" src="/images/prodental.png" alt="" />
				</a>
				<button
					type="button"
					class="btn-icon size-8 text-lg variant-soft-surface rounded-md"
					on:click={() => ($sideBarOpenActive = false)}
				>
					<i class="fa-solid fa-left"></i>
				</button>
			</div>
		</div>
		<div class="px-6 space-y-4">
			<div class="relative my-4">
				<div class="absolute top-[7px] left-4 text-lg text-surface-400">
					<i class="fa-solid fa-magnifying-glass"></i>
				</div>
				<input
					bind:value={searchInput}
					type="text"
					placeholder="Tìm chức năng"
					class="input rounded-container-token bg-surface-200 border-transparent pl-11"
				/>
			</div>
			{#each filteredFeatures as feature (feature.id)}
				{@const active = $usingFeature && feature.id === userFeatureDetails[$usingFeature].id}
				<a
					href={feature.url}
					class="flex items-center rounded-container-token text-black {active
						? 'bg-slate-100'
						: 'bg-white'}"
				>
					<div
						class="size-16 text-2xl flex justify-center items-center mx-1 {active
							? 'text-primary-500'
							: 'text-surface-400'}"
					>
						<i class="fa-solid {!active && feature.hasDuotone ? 'fa-duotone' : ''} {feature.faIcon}"
						></i>
					</div>
					<p class={active ? 'text-black font-bold' : 'text-surface-400 font-semibold'}>
						{feature.title}
					</p>
				</a>
			{/each}
		</div>
	</div>
</div>
