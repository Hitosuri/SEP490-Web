<script lang="ts">
	import SearchCombobox from '$lib/components/common/SearchCombobox.svelte';
	import endpoints from '$lib/endpoints';
	import type { Selected } from 'bits-ui';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	export let material: ExportGroup['exportMaterials'][number];
	export let index = 0;
	export let availableIds: number[];

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	let selectedAvailable: Selected<AvaiableMaterial> | undefined;
	let selecteds: AvaiableMaterial[] = [...material.avaliableMaterials];

	$: onSelectedAvailableChange(selectedAvailable);
	$: availableIds = selecteds.map((x) => x.id);

	function onSelectedAvailableChange(available: Selected<AvaiableMaterial> | undefined) {
		if (!available || availableIds.includes(available.value.id)) {
			return;
		}

		selecteds = [...selecteds, available.value];
		selectedAvailable = undefined;
	}

	async function searchAvailableMaterialsFn(
		keyword: string
	): Promise<Selected<AvaiableMaterial>[] | undefined> {
		if (!$userStore) {
			return;
		}

		const searchParams = new URLSearchParams();
		searchParams.set('page', '1');
		searchParams.set('size', '5');
		searchParams.set('materialId', String(material.materialId));
		searchParams.set('code', keyword);

		availableIds.forEach((x) => {
			if (x) {
				searchParams.append('excludeIds', String(x));
			}
		});

		const url = `${endpoints.availableMaterial.get}?${searchParams}`;
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${$userStore.token}`
			}
		});

		if (!response.ok) {
			return;
		}

		const data: Pagination<AvaiableMaterial[]> = await response.json();

		return data.data.map((x) => ({
			label: x.code ?? '',
			value: x
		}));
	}

	function removeCode(id: number) {
		selecteds = selecteds.filter((x) => x.id !== id);
	}
</script>

<div class="border border-surface-200 rounded-xl p-2">
	<div class="flex items-center gap-x-4 pl-2">
		<span class="font-bold text-surface-300">#{index + 1}</span>
		<span>
			<span class="font-semibold">{material.name}</span>
			<span class="text-sm font-medium">(Sl: {material.quantity})</span>
		</span>
		<SearchCombobox
			disabled={material.quantity === selecteds.length}
			regionInput="w-52"
			regionWrapper="ml-auto"
			searchFn={searchAvailableMaterialsFn}
			bind:selected={selectedAvailable}
			placeholder="Mã vật tư..."
			clearable
		/>
	</div>
	{#if selecteds.length > 0}
		<div class="flex gap-1 pt-2">
			{#each selecteds as available (available.id)}
				<div class="chip variant-filled-secondary">
					<span class="font-medium">{available.code}</span>
					<button on:click={() => removeCode(available.id)}>✕</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
