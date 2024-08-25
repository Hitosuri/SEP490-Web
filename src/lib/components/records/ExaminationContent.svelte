<script lang="ts">
	import { error } from '@sveltejs/kit';
	import endpoints from '$lib/endpoints';
	import { editRecordSchema } from '$lib/form-schemas/edit-record-schema';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { createEventDispatcher, getContext, setContext } from 'svelte';
	import { derived, type Writable } from 'svelte/store';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { z } from 'zod';
	import SearchCombobox from '$lib/components/common/SearchCombobox.svelte';
	import type { Selected } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { RecordStatus } from '$lib/constants/record-constant';
	import { autoHeightTextArea } from '$lib/actions/auto-height-textarea';
	import ExtraMaterialEditRow from '$lib/components/records/ExtraMaterialEditRow.svelte';
	import { formatCurrency } from '$lib/helpers/formatters';

	export let editRecordForm: SuperValidated<z.infer<typeof editRecordSchema>>;
	export let record: RecordPatient;
	export let recordId: number;
	export let extraMaterials: Material[] = [];

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
	const { form: formData, enhance, errors } = form;
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
				price: 0,
				materials: [...x.defaultMaterials]
			}
		])
	);
	let usedMaterials: z.infer<typeof editRecordSchema>['recordExtraMaterialRequests'] = [
		...record.extraMaterials.map((x) => ({
			materialId: x.materialId,
			quantity: x.quantity,
			isBasicUnit: x.isBasicUnit
		}))
	];
	let materialErrors = derived(errors, (errors) => {
		if (!errors.recordExtraMaterialRequests) {
			return {} as Record<number | string, string[]>;
		}
		return Object.entries(errors.recordExtraMaterialRequests).reduce(
			(c, p) => {
				c[p[0]] = Array.isArray(p[1])
					? [...p[1]]
					: [...(p[1].materialId ?? []), ...(p[1].quantity ?? []), ...(p[1].isBasicUnit ?? [])];
				return c;
			},
			{} as Record<number | string, string[]>
		);
	});

	$: allMaterialId = usedMaterials.map((x) => x.materialId).filter((x) => x > 0);
	$: $formData.recordExtraMaterialRequests = [...usedMaterials];

	setContext('material-errors', materialErrors);
	resetValue();

	function resetValue() {
		$formData.treatmentId = record.recordTreatmentListItemDtos.map((x) => x.treatmentId);
		$formData.reason = record.reason;
		$formData.diagnosis = record.diagnostic;
	}

	function removeTreatment(id: number) {
		$formData.treatmentId = $formData.treatmentId.filter((x) => x !== id);
		selectedTreatment = undefined;
	}

	function removeMaterial(index: number) {
		const m = usedMaterials[index];
		usedMaterials = usedMaterials.filter((_, i) => i !== index);
		extraMaterials = extraMaterials.filter((x) => x.id === m.materialId);
	}

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

	function addTreatment() {
		if (!selectedTreatment) {
			return;
		}

		treatments[selectedTreatment.value.id] = selectedTreatment.value;
		$formData.treatmentId = [...$formData.treatmentId, selectedTreatment.value.id];
		selectedTreatment = undefined;
	}

	function addMaterial() {
		usedMaterials = [
			...usedMaterials,
			{
				materialId: 0,
				quantity: 0,
				isBasicUnit: true
			}
		];
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
		<div class="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-4">
			<div>
				<Field {form} name="treatmentId">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none text-lg mb-1">
							Sử dụng dịch vụ
						</Label>
						<div class="flex flex-col gap-y-4">
							{#each $formData.treatmentId as treatmentId}
								{@const treatment = treatments[treatmentId]}
								{#if treatment}
									<div class="grid grid-cols-[2fr_1fr_1fr]">
										<div
											class="flex justify-between items-center col-span-3 overflow-hidden bg-gradient-to-r from-indigo-500 to-sky-500 text-white pl-3 p-2 {treatment
												.materials.length > 0
												? 'rounded-t-md'
												: 'rounded-md'}"
										>
											<span class="text-lg font-semibold">
												{treatment.name}
												({formatCurrency(treatment.price)})
											</span>
											{#if canEdit}
												<button
													type="button"
													class="btn-icon btn-icon-sm rounded text-xl h-fit bg-white text-error-500"
													on:click={() => removeTreatment(treatmentId)}
												>
													<i class="fa-solid fa-xmark"></i>
												</button>
											{/if}
										</div>
										{#if treatment.materials.length > 0}
											<div
												class="text-sm bg-slate-200 font-semibold text-start px-2 py-1 border-b border-l"
											>
												Vật tư
											</div>
											<div class="text-sm bg-slate-200 font-semibold text-start px-2 py-1 border-b">
												Đơn vị
											</div>
											<div
												class="text-sm bg-slate-200 font-semibold text-end px-2 py-1 border-b border-r"
											>
												Số lượng
											</div>
											{#each treatment.materials as material, i (material.materialId)}
												{@const lastItem = i === treatment.materials.length - 1}
												<div
													class="text-start px-2 py-1.5 bg-slate-100 border-b border-l {lastItem
														? 'overflow-hidden rounded-bl-md'
														: ''}"
												>
													{material.materialName}
												</div>
												<div class="text-start px-2 py-1.5 border-b border-r">
													{material.unit}
												</div>
												<div
													class="text-end px-2 py-1.5 border-r border-b {lastItem
														? 'overflow-hidden rounded-br-md'
														: ''}"
												>
													{material.quantity}
												</div>
											{/each}
										{/if}
									</div>
								{/if}
							{/each}
						</div>
						{#if canEdit}
							<div class="flex gap-2 mt-4">
								<SearchCombobox
									searchFn={searchTreatmentsFn}
									bind:selected={selectedTreatment}
									placeholder="Tên thủ thuật"
									clearable
									regionWrapper="w-full"
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
			<div>
				<Field {form} name="treatmentId">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none text-lg mb-1">
							Vật tư được sử dụng thêm
						</Label>
						<table class="w-full">
							<colgroup>
								<col class="w-10" />
								<col />
								<col />
								<col class="w-40" />
								{#if canEdit}
									<col class="w-10" />
								{/if}
							</colgroup>
							<thead>
								<tr class="border-b">
									<th class="">#</th>
									<th class="text-start px-2 py-2">Vật tư</th>
									<th class="px-2 py-2">Đơn vị</th>
									<th class="text-end px-2 py-2">Số lượng</th>
									{#if canEdit}
										<th class=""></th>
									{/if}
								</tr>
							</thead>
							<tbody>
								{#if canEdit}
									{#each usedMaterials as material, i (material)}
										{@const foundInExtra = extraMaterials.find((x) => x.id === material.materialId)}
										{@const foundInExtra2 = foundInExtra
											? record.extraMaterials.find((x) => x.materialId === material.materialId)
											: undefined}
										{#if foundInExtra && foundInExtra2}
											<ExtraMaterialEditRow
												bind:selectedMaterialId={material.materialId}
												bind:quantity={material.quantity}
												bind:isBasicUnit={material.isBasicUnit}
												index={i}
												excludeIds={allMaterialId}
												initMaterial={foundInExtra}
												initUnit={foundInExtra2.isBasicUnit}
												initQuantity={foundInExtra2.quantity}
												on:remove={() => removeMaterial(i)}
											/>
										{:else}
											<ExtraMaterialEditRow
												bind:selectedMaterialId={material.materialId}
												bind:quantity={material.quantity}
												bind:isBasicUnit={material.isBasicUnit}
												index={i}
												excludeIds={allMaterialId}
												on:remove={() => removeMaterial(i)}
											/>
										{/if}
									{:else}
										<tr>
											<td colspan="5" class="border-b py-3">
												<h3 class="h3 font-semibold text-center text-tertiary-500">
													Danh sách trống
												</h3>
											</td>
										</tr>
									{/each}
									<tr>
										<td colspan="4" class="py-2">
											<div class="w-10">
												<button
													type="button"
													class="btn-icon btn-icon-sm rounded-container-token variant-filled-primary block mx-auto"
													on:click={addMaterial}
												>
													<i class="fa-solid fa-plus"></i>
												</button>
											</div>
										</td>
									</tr>
								{:else}
									{#each record.extraMaterials as material, i (material.materialId)}
										<tr class="border-b">
											<td class="text-center px-2 py-2">{i + 1}</td>
											<td class="text-start px-2 py-2">{material.materialName}</td>
											<td class="text-center px-2 py-2">{material.unit}</td>
											<td class="text-end px-2 py-2">{material.quantity}</td>
										</tr>
									{:else}
										<tr>
											<td colspan="5" class="border-b py-3">
												<h3 class="h3 font-semibold text-center text-tertiary-500">
													Danh sách trống
												</h3>
											</td>
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
		</div>
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
