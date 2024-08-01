<script lang="ts">
	import { userFeatureDetails } from '$lib/constants/user-feature-constant';
	import usingFeature from '$lib/stores/using-feature-store';
	import { getContext } from 'svelte';
	import type { Readable, Writable } from 'svelte/store';
	import { fly } from 'svelte/transition';

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
	$: usingFeatureIndex = filteredFeatures.findIndex((x) => x.id === $usingFeature);
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
		<div class="px-6 pt-4">
			<div class="relative mb-6">
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
			<div class="space-y-4 relative">
				<div
					class="absolute w-full h-16 bg-slate-100 rounded-container-token transition-all duration-300 -z-10 {usingFeatureIndex >=
					0
						? 'opacity-100'
						: 'opacity-0'}"
					style="top: {(64 + 16) * Math.max(0, usingFeatureIndex)}px;"
				></div>
				{#each filteredFeatures as feature, i (feature.id)}
					{@const active = usingFeatureIndex === i}
					<a href={feature.url} class="flex items-center">
						<div
							class="size-16 text-2xl flex justify-center items-center mx-1 {active
								? 'text-primary-500'
								: 'text-surface-400'}"
						>
							<i
								class="fa-solid {!active && feature.hasDuotone
									? 'fa-duotone'
									: ''} {feature.faIcon}"
							></i>
						</div>
						<p class="flex-1 {active ? 'text-black font-bold' : 'text-surface-400 font-semibold'}">
							{feature.title}
						</p>
						{#if active}
							<div
								transition:fly={{
									duration: 200,
									x: -16
								}}
								class="text-slate-500 -mr-3 ml-3"
							>
								<i class="fa-solid fa-caret-right"></i>
							</div>
						{/if}
					</a>
				{/each}
			</div>
		</div>
	</div>
</div>
