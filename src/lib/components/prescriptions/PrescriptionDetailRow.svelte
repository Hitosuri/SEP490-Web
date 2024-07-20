<script lang="ts">
	import endpoints from '$lib/endpoints';
	import { editPrescriptionDetailSchema } from '$lib/form-schemas/edit-prescription-detail-schema';
	import type { Selected } from 'bits-ui';
	import { Control, Field, FieldErrors } from 'formsnap';
	import { createEventDispatcher, getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import SearchCombobox from '../common/SearchCombobox.svelte';
	import NumberInput from '../common/NumberInput.svelte';
	import { autoHeightTextArea } from '$lib/actions/auto-height-textarea';

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

	$: $formData.materialId = selectedMedicine?.value.id ?? 1;
	$: $formData.dosage = selectedMedicine?.value.medicine?.dosage ?? '';
	$: $formData.quantiy = prescriptionDetail.quantiy;

	resetValue();

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

	function resetValue() {
		selectedMedicine = {
			label: prescriptionDetail.medicineDetail.name,
			value: {
				id: prescriptionDetail.medicineDetail.id,
				name: prescriptionDetail.medicineDetail.name,
				materialTypeName: 'Thuốc',
				price: prescriptionDetail.medicineDetail.price,
				quantity: prescriptionDetail.medicineDetail.quantity,
				supplierName: '',
				medicine: {
					id: prescriptionDetail.medicineDetail.id,
					dosage: prescriptionDetail.medicineDetail.dosage,
					uses: prescriptionDetail.medicineDetail.uses
				}
			}
		};
	}
</script>

<tr class="border-b {editing ? '*:align-top' : ''}">
	<td class="px-4 py-2 text-center leading-[42px]">{index + 1}</td>
	<td class="px-4 py-2 text-start">
		{#if editing}
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
		{:else}
			{prescriptionDetail.medicineDetail.name}
		{/if}
	</td>
	<td class="px-4 py-2 text-end">
		{#if editing}
			<div>
				<Field {form} name="quantiy">
					<Control let:attrs>
						<NumberInput {...attrs} bind:value={$formData.quantiy} />
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
		{:else}
			{prescriptionDetail.quantiy}
		{/if}
	</td>
	<td class="px-4 py-2 text-start">
		{#if editing}
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
		{:else}
			{prescriptionDetail.medicineDetail.dosage}
		{/if}
	</td>
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
