<script lang="ts">
	import type { Selected } from 'bits-ui';
	import SearchCombobox from '$lib/components/common/SearchCombobox.svelte';
	import type { Readable, Writable } from 'svelte/store';
	import { createEventDispatcher, getContext, onMount } from 'svelte';
	import endpoints from '$lib/endpoints';
	import DropdownSelect from '$lib/components/common/DropdownSelect.svelte';
	import NumberInput from '$lib/components/common/NumberInput.svelte';

	export let index: number = 0;
	export let selectedMaterialId: number;
	export let quantity: number;
	export let isBasicUnit: boolean;
	export let excludeIds: number[] = [];
	export let initMaterial: Material | undefined = undefined;
	export let initUnit: boolean | undefined = undefined;
	export let initQuantity: number | undefined = undefined;

	const dispatch = createEventDispatcher<{ remove: undefined }>();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	let selectedMaterial: Selected<Material> | undefined = initMaterial
		? { value: initMaterial, label: initMaterial.name }
		: undefined;
	let materialUnits: Selected<boolean>[] = [];
	let selectedUnit: Selected<boolean> | undefined = undefined;
	let refreshTrigger = Math.random();
	let errorList: string[] = [];
	let changeCount = 0;
	let errors = getContext<Readable<Record<string | number, string[]>>>('material-errors');

	$: selectedMaterialId = selectedMaterial?.value.id ?? 0;
	$: isBasicUnit = selectedUnit?.value ?? true;
	$: onSelectedMaterialChanged(selectedMaterial);
	$: onSelectedUnitChanged(selectedUnit);
	$: errorList = $errors[index] ?? []

	function onSelectedUnitChanged(selectedUnit: Selected<boolean> | undefined) {
		if (
			changeCount <= 2 &&
			initUnit != null &&
			initMaterial &&
			initQuantity != null &&
			initMaterial.id === selectedMaterial?.value.id &&
			initUnit === selectedUnit?.value
		) {
			quantity = initQuantity;
			return;
		}
		quantity = 0;
	}

	function onSelectedMaterialChanged(selectedMaterial: Selected<Material> | undefined) {
		if (selectedMaterial) {
			changeCount++;
			materialUnits = [
				{
					label: selectedMaterial.value.basicUnit,
					value: true
				},
				{
					label: selectedMaterial.value.smallestUnit,
					value: false
				}
			];
			if (changeCount <= 2 && initUnit != null && initMaterial?.id === selectedMaterial.value.id) {
				selectedUnit = materialUnits[initUnit ? 0 : 1];
			} else {
				selectedUnit = materialUnits[0];
			}
		} else {
			materialUnits = [];
			selectedUnit = undefined;
		}
		refreshTrigger = Math.random();
	}

	async function searchMaterialsFn(keyword: string): Promise<Selected<Material>[] | undefined> {
		if (!$userStore) {
			return;
		}

		const searchParams = new URLSearchParams();
		searchParams.set('page', '1');
		searchParams.set('size', '5');
		searchParams.set('materialName', keyword);

		excludeIds.forEach((x) => {
			if (x) {
				searchParams.append('excludeIds', String(x));
			}
		});

		const url = `${endpoints.materials.get}?${searchParams}`;
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${$userStore.token}`
			}
		});

		if (!response.ok) {
			return;
		}

		const data: Pagination<Material[]> = await response.json();

		return data.data.map((x) => ({
			label: x.name ?? '',
			value: x
		}));
	}
</script>

<tr class={errorList.length === 0 ? 'border-b' : ''}>
	<td class="py-2 text-center leading-[42px] text-success-500 min-w-[33px]">{index + 1}</td>
	<td class="px-2 py-2 align-top">
		<SearchCombobox
			bind:selected={selectedMaterial}
			searchFn={searchMaterialsFn}
			placeholder="Tên vật tư..."
			clearable
		/>
	</td>
	<td class="px-2 py-2 align-top">
		{#key refreshTrigger}
			<DropdownSelect
				disabled={materialUnits.length === 0}
				items={materialUnits}
				bind:selected={selectedUnit}
				regionInput="border border-surface-500/35 h-[42px] px-3 focus:ring-primary justify-between w-full"
				regionContent="z-[1000]"
				let:ValueComponent
			>
				<ValueComponent class="font-semibold" />
				<div class="flex flex-col text-[0.55rem] pl-6 text-surface-400">
					<i class="fa-solid fa-chevron-up"></i>
					<i class="fa-solid fa-chevron-down"></i>
				</div>
			</DropdownSelect>
		{/key}
	</td>
	<td class="px-2 py-2 align-top">
		<NumberInput
			bind:value={quantity}
			step={isBasicUnit ? 1 : selectedMaterial?.value.smallestUnitQuantity || 1}
		/>
	</td>
	<td>
		<button
			type="button"
			class="btn-icon btn-icon-sm rounded-container-token variant-soft-error mx-auto block"
			on:click={() => dispatch('remove')}
		>
			<i class="fa-solid fa-xmark"></i>
		</button>
	</td>
</tr>
{#if errorList.length > 0}
	<tr class="border-b">
		<td></td>
		<td colspan="4" data-fs-field-errors class="px-2 pb-2">
			{#each errorList as error}
				<p data-fs-field-error data-fs-error>- {error}</p>
			{/each}
		</td>
	</tr>
{/if}
