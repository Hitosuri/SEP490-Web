<script lang="ts">
	import endpoints from '$lib/endpoints';
	import { editRecordSchema } from '$lib/form-schemas/edit-record-schema';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { createEventDispatcher, getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { z } from 'zod';
	import SearchCombobox from '../common/SearchCombobox.svelte';
	import type { Selected } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { RecordStatus } from '$lib/constants/record-constant';
	import { autoHeightTextArea } from '$lib/actions/auto-height-textarea';
	import NumberInput from '../common/NumberInput.svelte';

	export let editRecordForm: SuperValidated<z.infer<typeof editRecordSchema>>;
	export let record: RecordPatient;
	export let recordId: number;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const dispatch = createEventDispatcher<{
		finishUpdate: undefined;
	}>();
	const form = superForm(editRecordForm, {
		id: `record-${recordId}`,
		validators: zodClient(editRecordSchema),
		resetForm: false,
		SPA: true,
		onChange: ({ paths, get, set }) => {
			dataChanged = true;
			const path = paths[0] ?? '';
			if (!path.endsWith('.quantity')) {
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

			const response = await fetch(endpoints.records.detail(recordId), {
				method: 'PUT',
				headers: {
					'content-type': 'application/json',
					Authorization: `Bearer ${$userStore.token}`
				},
				body: JSON.stringify({
					...form.data
				})
			});

			if (response.ok) {
				dispatch('finishUpdate');
				resetValue();
				dataChanged = false;
			} else {
				toast.error('Không lưu được hồ sơ');
			}
		}
	});
	const { form: formData, enhance } = form;
	let dataChanged = true;
	let canEdit = record.status === RecordStatus.PROCESSING && $userStore?.id === record.doctor.id;
	let selectedTreatment: Selected<Treatment> | undefined;
	let treatments: Record<number, Treatment> = Object.fromEntries(
		record.recordTreatmentListItemDtos.map((x) => [
			x.treatmentId,
			{
				id: x.treatmentId,
				name: x.treatmentName,
				deleted: false,
				price: 0
			}
		])
	);
	let selectedMaterial: Selected<Material> | undefined;
	let selectedMaterialQuantity = 0;
	// let materials: Record<number, Material> = Object.fromEntries(
	// 	record.usedMaterials.map((x) => [
	// 		x.materialId,
	// 		{
	// 			id: x.materialId,
	// 			name: x.materialName,
	// 			price: 0,
	// 			quantity: 0,
	// 			supplierName: '',
	// 			materialTypeName: ''
	// 		}
	// 	])
	// );

	$: selectedMaterialQuantityCap(selectedMaterialQuantity);

	resetValue();

	function selectedMaterialQuantityCap(value: number) {
		if (!Number(value) || value < 1) {
			selectedMaterialQuantity = 1;
		}
	}

	function resetValue() {
		$formData.treatmentId = record.recordTreatmentListItemDtos.map((x) => x.treatmentId);
		// $formData.extraMaterials = record.usedMaterials.map((x) => ({
		// 	materialId: x.materialId,
		// 	quantity: x.quantity
		// }));
		$formData.reason = record.reason;
		$formData.diagnosis = record.diagnostic;
	}

	function removeTreatment(id: number) {
		$formData.treatmentId = $formData.treatmentId.filter((x) => x !== id);
		selectedTreatment = undefined;
	}

	// function removeMaterial(id: number) {
	// 	$formData.extraMaterials = $formData.extraMaterials.filter((x) => x.materialId !== id);
	// 	selectedMaterial = undefined;
	// }

	async function searchTreatmentsFn(keyword: string): Promise<Selected<Treatment>[] | undefined> {
		if (!$userStore) {
			return;
		}

		const searchParams = new URLSearchParams();
		searchParams.set('page', '1');
		searchParams.set('size', '5');
		searchParams.set('name', keyword);

		$formData.treatmentId.forEach((x) => {
			searchParams.append('excludeIds', String(x));
		});

		const url = `${endpoints.treatments.get}?${searchParams}`;
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${$userStore.token}`
			}
		});

		if (!response.ok) {
			return;
		}

		const data: ApiResponse<Pagination<Treatment[]>> = await response.json();

		if (!data.body) {
			return;
		}

		return data.body.data.map((x) => ({
			label: x.name ?? '',
			value: x
		}));
	}

	async function searchMaterialsFn(keyword: string): Promise<Selected<Material>[] | undefined> {
		if (!$userStore) {
			return;
		}

		const searchParams = new URLSearchParams();
		searchParams.set('page', '1');
		searchParams.set('size', '5');
		searchParams.set('materialName', keyword);

		// $formData.extraMaterials.forEach((x) => {
		// 	searchParams.append('excludeIds', String(x.materialId));
		// });

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

	function addTreatment() {
		if (!selectedTreatment) {
			return;
		}

		treatments[selectedTreatment.value.id] = selectedTreatment.value;
		$formData.treatmentId = [...$formData.treatmentId, selectedTreatment.value.id];
		selectedTreatment = undefined;
	}

	function addMaterial() {
		if (!selectedMaterial) {
			return;
		}

		// materials[selectedMaterial.value.id] = selectedMaterial.value;
		// $formData.extraMaterials = [
		// 	...$formData.extraMaterials,
		// 	{
		// 		materialId: selectedMaterial.value.id,
		// 		quantity: Math.max(1, Math.round(selectedMaterialQuantity))
		// 	}
		// ];
		selectedMaterial = undefined;
	}
</script>

<form method="post" use:enhance class="bg-white rounded-container-token shadow-md p-6 border">
	<p class="font-semibold text-2xl select-none mb-4">Nội dung khám</p>
	<div class="space-y-4 pl-4">
		<div>
			<Field {form} name="reason">
				<Control let:attrs>
					<Label class="font-semibold text-surface-500 select-none text-lg">Lý do</Label>
					{#if canEdit}
						<textarea
							{...attrs}
							class="textarea bg-white mt-1"
							placeholder="Nhập lý do..."
							bind:value={$formData.reason}
							use:autoHeightTextArea={{
								minRows: 2,
								value: $formData.reason
							}}
						></textarea>
					{:else}
						{@const lines = record.reason.split(/\n|\r\n/g)}
						<div class="px-4 py-1 space-y-1">
							{#if record.reason}
								{#each lines as line}
									<p>{line}</p>
								{/each}
							{:else}
								<h4 class="h4 font-semibold text-center text-surface-400">Lý do trống</h4>
							{/if}
						</div>
					{/if}
				</Control>
				<FieldErrors class="text-sm mt-1" />
			</Field>
		</div>
		<div>
			<Field {form} name="diagnosis">
				<Control let:attrs>
					<Label class="font-semibold text-surface-500 select-none text-lg">Chẩn đoán</Label>
					{#if canEdit}
						<textarea
							{...attrs}
							class="textarea bg-white mt-1"
							placeholder="Nhập chẩn đoán..."
							bind:value={$formData.diagnosis}
							use:autoHeightTextArea={{
								minRows: 2,
								value: $formData.diagnosis
							}}
						></textarea>
					{:else}
						{@const lines = record.diagnostic.split(/\n|\r\n/g)}
						<div class="px-4 py-1 space-y-1">
							{#if record.diagnostic}
								{#each lines as line}
									<p>{line}</p>
								{/each}
							{:else}
								<h4 class="h4 font-semibold text-center text-surface-400">Chẩn đoán trống</h4>
							{/if}
						</div>
					{/if}
				</Control>
				<FieldErrors class="text-sm mt-1" />
			</Field>
		</div>
		<div>
			<Field {form} name="treatmentId">
				<Control let:attrs>
					<Label class="font-semibold text-surface-500 select-none text-lg mb-1"
						>Thủ thuật được sử dụng</Label
					>
					<div class="flex flex-wrap gap-y-4 gap-x-6">
						{#if canEdit}
							{#each $formData.treatmentId as treatmentId}
								{@const treatment = treatments[treatmentId]}
								{#if treatment}
									<div class="variant-ghost-tertiary py-3 px-6 rounded-md relative">
										<button
											on:click={() => removeTreatment(treatment.id)}
											type="button"
											class="btn p-0 absolute -right-3 -top-1 bg-error-400 size-6 flex justify-center items-center rounded-full"
										>
											<i class="fa-solid fa-xmark"></i>
										</button>
										<span class="text-lg font-semibold">{treatment.name}</span>
									</div>
								{/if}
							{/each}
						{:else}
							{#each record.recordTreatmentListItemDtos as treatment (treatment.treatmentId)}
								<div class="variant-ghost-tertiary py-3 px-6 rounded-md">
									<span class="text-lg font-semibold">{treatment.treatmentName}</span>
								</div>
							{:else}
								<h4 class="h4 font-semibold text-center text-surface-400 w-full">
									Danh sách trống
								</h4>
							{/each}
						{/if}
					</div>
					{#if canEdit}
						<div class="flex gap-2 mt-2">
							<SearchCombobox
								searchFn={searchTreatmentsFn}
								bind:selected={selectedTreatment}
								placeholder="Tên thủ thuật"
								clearable
							/>
							<button
								type="button"
								class="btn variant-filled-primary rounded-container-token"
								on:click={addTreatment}
							>
								<i class="fa-solid fa-plus"></i>
								<span class="pl-2">Thêm</span>
							</button>
						</div>
					{/if}
				</Control>
				<FieldErrors class="text-sm mt-1" />
			</Field>
		</div>
		<!-- <div>
			<Field {form} name="treatmentId">
				<Control let:attrs>
					<Label class="font-semibold text-surface-500 select-none text-lg mb-1">
						Vật tư tiêu hao được sử dụng
					</Label>
					<div class="flex flex-wrap gap-y-4 gap-x-6">
						{#if canEdit}
							{#each $formData.extraMaterials as m}
								{@const material = materials[m.materialId]}
								{#if material}
									<div class="variant-ghost-tertiary py-3 px-6 rounded-md relative">
										<button
											on:click={() => removeMaterial(material.id)}
											type="button"
											class="btn p-0 absolute -right-3 -top-1 bg-error-400 size-6 flex justify-center items-center rounded-full"
										>
											<i class="fa-solid fa-xmark"></i>
										</button>
										<p class="text-lg font-semibold">{material.name}</p>
										<input
											type="number"
											bind:value={m.quantity}
											class="input bg-white/50 rounded-container-token py-1 px-2 w-20 mt-1"
										/>
									</div>
								{/if}
							{/each}
						{:else}
							{#each record.usedMaterials as material (material.materialId)}
								<div class="variant-ghost-tertiary py-3 px-6 rounded-md">
									<p class="text-lg font-semibold">{material.materialName}</p>
									<span class="text-sm"> x{material.quantity}</span>
								</div>
							{:else}
								<h4 class="h4 font-semibold text-center text-surface-400 w-full">
									Danh sách trống
								</h4>
							{/each}
						{/if}
					</div>
					{#if canEdit}
						<div class="flex gap-2 mt-2">
							<SearchCombobox
								searchFn={searchMaterialsFn}
								bind:selected={selectedMaterial}
								placeholder="Tên vật tư..."
								clearable
							/>
							<NumberInput placeholder="Số lượng" bind:value={selectedMaterialQuantity} />
							<button
								type="button"
								class="btn variant-filled-primary rounded-container-token"
								on:click={addMaterial}
							>
								<i class="fa-solid fa-plus"></i>
								<span class="pl-2">Thêm</span>
							</button>
						</div>
					{/if}
				</Control>
				<FieldErrors class="text-sm mt-1" />
			</Field>
		</div> -->
		{#if canEdit}
			<div>
				{#if !dataChanged}
					<p
						class="font-bold text-sm text-primary-500 mb-1 text-end bg-gradient-to-l from-primary-100 px-1.5 py-0.5"
					>
						Đã lưu các thay đổi
					</p>
				{/if}
				<button
					type="submit"
					class="btn variant-filled-tertiary rounded-container-token ml-auto block"
				>
					<i class="fa-solid fa-floppy-disk"></i>
					<span>Lưu thay đổi</span>
				</button>
			</div>
		{/if}
	</div>
</form>
