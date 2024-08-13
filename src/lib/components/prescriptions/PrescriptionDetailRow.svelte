<script lang="ts">
	import endpoints from '$lib/endpoints';
	import { editPrescriptionDetailSchema } from '$lib/form-schemas/edit-prescription-detail-schema';
	import type { Selected } from 'bits-ui';
	import { Control, Field, FieldErrors } from 'formsnap';
	import { createEventDispatcher, getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import SearchCombobox from '../common/SearchCombobox.svelte';
	import NumberInput from '../common/NumberInput.svelte';
	import { autoHeightTextArea } from '$lib/actions/auto-height-textarea';
	import DropdownSelect from '../common/DropdownSelect.svelte';
	import Loading from '../common/Loading.svelte';
	import { browser } from '$app/environment';

	export let prescriptionDetail: PrescriptionDetail;
	export let editPrescriptionDetailForm: SuperValidated<
		z.infer<typeof editPrescriptionDetailSchema>
	>;
	export let editMode = false;
	export let index = 0;
	export let searchMaterialFn: (keyword: string) => Promise<Selected<Material>[] | undefined>;
	export let prescriptionId: number;

	const dispatch = createEventDispatcher<{
		finishUpdate: number;
		finishDelete: number;
	}>();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const form = superForm(editPrescriptionDetailForm, {
		id: `detail-${prescriptionDetail.id}`,
		validators: zodClient(editPrescriptionDetailSchema),
		resetForm: false,
		SPA: true,
		onChange: ({ paths, get, set }) => {
			const path = paths[0] ?? '';

			if (path !== 'quantiy') {
				return;
			}

			const value = get(path);

			if (!value || (typeof value === 'number' && value < 1)) {
				set(path, 1);
			}
		},
		onUpdate: async ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}

			const response = await fetch(endpoints.prescriptions.detailEdit(prescriptionDetail.id), {
				method: 'PUT',
				headers: {
					'content-type': 'application/json',
					Authorization: `Bearer ${$userStore.token}`
				},
				body: JSON.stringify({
					...form.data,
					prescriptionId
				})
			});

			if (response.ok) {
				dispatch('finishUpdate', prescriptionDetail.id);
				editing = false;
			}
		}
	});
	const { form: formData, enhance } = form;
	let selectedMedicine: Selected<Material> | undefined;
	let editing = false;
	let materialUnits: Selected<boolean>[] = [];
	let firstEdit = false;
	let refreshTrigger = Math.random();
	let selectedUnit: Selected<boolean> | undefined;
	let loadStatus: 'init' | 'loading' | 'fail' | 'success' = 'init';

	$: $formData.materialId = selectedMedicine?.value.id ?? 1;
	$: $formData.dosage = selectedMedicine?.value.medicine?.dosage ?? '';
	$: $formData.quantiy = prescriptionDetail.quantiy;
	$: $formData.isBasicUnit = selectedUnit?.value ?? true;
	$: onEditingChanged(editing);
	$: onSelectedMaterialChanged(selectedMedicine);

	async function loadDefaultMaterial() {
		if (!$userStore) {
			loadStatus = 'fail';
			return;
		}
		loadStatus = 'loading';
		const searchParams = new URLSearchParams();
		searchParams.set('page', '1');
		searchParams.set('size', '1');
		searchParams.set('includeIds', String(prescriptionDetail.medicineDetail.id));
		const r = await fetch(`${endpoints.materials.get}?${searchParams}`, {
			headers: {
				Authorization: `Bearer ${$userStore.token}`
			}
		});

		if (!r.ok) {
			loadStatus = 'fail';
			return;
		}

		const data: Pagination<Material[]> = await r.json();

		if (!data.data[0]) {
			loadStatus = 'fail';
			return;
		}

		selectedMedicine = {
			value: data.data[0],
			label: data.data[0].name
		};
		loadStatus = 'success';
	}

	function onSelectedMaterialChanged(selectedMaterial: Selected<Material> | undefined) {
		if (selectedMaterial) {
			materialUnits = selectedMaterial.value.isSurcharge
				? [
						{
							label: selectedMaterial.value.basicUnit,
							value: true
						},
						{
							label: selectedMaterial.value.smallestUnit,
							value: false
						}
					]
				: [
						{
							label: selectedMaterial.value.basicUnit,
							value: true
						}
					];
			selectedUnit = materialUnits[0];
		} else {
			materialUnits = [];
			selectedUnit = undefined;
		}
		refreshTrigger = Math.random();
	}

	function onEditingChanged(value: boolean) {
		if (firstEdit || !value || !browser) {
			return;
		}
		firstEdit = true;
		loadDefaultMaterial();
	}

	async function deletePrescriptionDetail() {
		if (!$userStore) {
			return;
		}

		const r = await fetch(endpoints.prescriptions.detailDelete(prescriptionDetail.id), {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${$userStore.token}`
			}
		});

		if (r.ok) {
			dispatch('finishDelete', prescriptionDetail.id);
		}
	}
</script>

<tr class="border-b {editing ? '*:align-top' : ''}">
	<td class="p-2 text-center leading-[42px]">{index + 1}</td>
	{#if editing}
		{#if loadStatus === 'init'}
			<td colspan="4" class="p-2">-</td>
		{/if}
		{#if loadStatus === 'fail'}
			<td colspan="4" class="p-2">
				<button
					type="button"
					class="btn variant-filled-error rounded-container-token block mx-auto"
					on:click={() => loadDefaultMaterial()}
				>
					<i class="fa-solid fa-rotate"></i>
					<span>Tải lại</span>
				</button>
			</td>
		{/if}
		{#if loadStatus === 'loading'}
			<td colspan="4" class="p-2">
				<Loading class="w-full justify-center items-center h-[42px]" />
			</td>
		{/if}
		{#if loadStatus === 'success'}
			<td class="p-2 text-start">
				<div>
					<Field {form} name="materialId">
						<Control>
							<SearchCombobox
								placeholder="Tên thuốc..."
								searchFn={searchMaterialFn}
								bind:selected={selectedMedicine}
							></SearchCombobox>
						</Control>
						<FieldErrors class="text-sm mt-1" />
					</Field>
				</div>
			</td>
			<td class="p-2 text-center">
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
			</td>
			<td class="p-2 text-end">
				<div>
					<Field {form} name="quantiy">
						<Control let:attrs>
							<NumberInput {...attrs} bind:value={$formData.quantiy} />
						</Control>
						<FieldErrors class="text-sm mt-1" />
					</Field>
				</div>
			</td>
			<td class="p-2 text-start">
				<div>
					<Field {form} name="dosage">
						<Control let:attrs>
							<textarea
								class="textarea flex-1 bg-white"
								rows="1"
								{...attrs}
								placeholder="Liều dùng..."
								bind:value={$formData.dosage}
								use:autoHeightTextArea={{
									value: $formData.dosage
								}}
							></textarea>
						</Control>
						<FieldErrors class="text-sm mt-1" />
					</Field>
				</div>
			</td>
		{/if}
	{:else if !editing}
		<td class="p-2 text-start">
			{prescriptionDetail.medicineDetail.name}
		</td>
		<td class="p-2 text-center">
			{prescriptionDetail.unit}
		</td>
		<td class="p-2 text-end">
			{prescriptionDetail.quantiy}
		</td>
		<td class="p-2 text-start">
			{prescriptionDetail.medicineDetail.dosage}
		</td>
	{/if}
	{#if editMode}
		<td class="py-2 w-auto">
			{#if editing}
				<form use:enhance method="post" class="flex gap-2">
					<button
						type="submit"
						class="btn-icon w-[42px] variant-filled-primary rounded-container-token"
					>
						<i class="fa-solid fa-floppy-disk"></i>
					</button>
					<button
						type="button"
						class="btn-icon w-[42px] variant-filled-error rounded-container-token"
						on:click={() => (editing = false)}
					>
						<i class="fa-solid fa-xmark"></i>
					</button>
				</form>
			{:else}
				<div class="flex justify-between gap-2">
					<button
						type="button"
						class="btn-icon w-[42px] variant-soft-tertiary rounded-container-token"
						on:click={() => (editing = true)}
					>
						<i class="fa-regular fa-pen-to-square"></i>
					</button>
					<button
						type="button"
						class="btn-icon w-[42px] variant-soft-error rounded-container-token"
						on:click={() => deletePrescriptionDetail()}
					>
						<i class="fa-regular fa-trash"></i>
					</button>
				</div>
			{/if}
		</td>
	{/if}
</tr>
