<script lang="ts">
	import { editPrescriptionDetailSchema } from '$lib/form-schemas/edit-prescription-detail-schema';
	import { getContext, type ComponentEvents } from 'svelte';
	import { type Writable } from 'svelte/store';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Control, Field, FieldErrors } from 'formsnap';
	import endpoints from '$lib/endpoints';
	import type { Selected } from 'bits-ui';
	import SearchCombobox from '$lib/components/common/SearchCombobox.svelte';
	import type { z } from 'zod';
	import PrescriptionDetailRow from './PrescriptionDetailRow.svelte';
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import { RecordStatus } from '$lib/constants/record-constant';
	import { autoHeightTextArea } from '$lib/actions/auto-height-textarea';
	import NumberInput from '../common/NumberInput.svelte';
	import DropdownSelect from '../common/DropdownSelect.svelte';

	export let prescription: Prescription;
	export let record: RecordPatient;
	export let editPrescriptionDetailForm: SuperValidated<
		z.infer<typeof editPrescriptionDetailSchema>
	>;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const createPrescriptionDetailForm = superForm(editPrescriptionDetailForm, {
		id: 'create',
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

			const createResponse = await fetch(endpoints.prescriptions.detailCreate, {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					Authorization: `Bearer ${$userStore.token}`
				},
				body: JSON.stringify({
					...form.data,
					prescriptionId: prescription.id
				})
			});

			if (createResponse.ok && prescription.id) {
				await refreshPrescription();
				createPrescriptionDetailForm.reset();
				selectedNewMaterial = undefined;
				trigger = Math.random();
			}
		}
	});
	const { form: createPrescriptionDetailFormData, enhance: createPrescriptionDetailFormEnhance } =
		createPrescriptionDetailForm;
	let selectedNewMaterial: Selected<Material> | undefined;
	let selectedUnit: Selected<boolean> | undefined;
	let canEdit = record.status === RecordStatus.PROCESSING && $userStore?.id === record.doctor.id;
	let indication = prescription.indication ?? '';
	let trigger: number = Math.random();
	let dataChanged = true;
	let materialUnits: Selected<boolean>[] = [];
	let refreshTrigger = Math.random();

	$: onSelectedMaterialChanged(selectedNewMaterial);
	$: onSelectedUnitChanged(selectedUnit);
	$: $createPrescriptionDetailFormData.materialId = selectedNewMaterial?.value.id ?? 0;
	$: $createPrescriptionDetailFormData.dosage = selectedNewMaterial?.value.medicine?.dosage ?? '';
	$: $createPrescriptionDetailFormData.isBasicUnit = selectedUnit?.value ?? true;

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

	function onSelectedUnitChanged(selectedUnit: Selected<boolean> | undefined) {
		$createPrescriptionDetailFormData.quantiy = 1;
	}

	async function updateIndication() {
		if (!$userStore) {
			return;
		}

		const newIndication = indication.trim();
		const r = await fetch(endpoints.prescriptions.edit(prescription.id), {
			method: 'PUT',
			headers: {
				'content-type': 'application/json',
				Authorization: `Bearer ${$userStore.token}`
			},
			body: JSON.stringify({
				indication: newIndication
			})
		});

		if (r.ok) {
			prescription.indication = newIndication;
			dataChanged = false;
		}
	}

	async function requestPrescription() {
		if (!$userStore) {
			return;
		}

		const presResponse = await fetch(endpoints.prescriptions.get(prescription.id), {
			headers: {
				Authorization: `Bearer ${$userStore.token}`
			}
		});

		const data: ApiResponse<Prescription> = await presResponse.json();

		if (!data.body) {
			return;
		}

		return data.body;
	}

	async function refreshPrescription() {
		const data = await requestPrescription();

		if (!data) {
			return;
		}

		prescription.details = data.details;
	}

	function onDetailFinishDelete(e: ComponentEvents<PrescriptionDetailRow>['finishDelete']) {
		prescription.details = prescription.details.filter((x) => x.id !== e.detail);
	}

	async function onDetailFinishUpdate(e: ComponentEvents<PrescriptionDetailRow>['finishUpdate']) {
		const data = await requestPrescription();

		if (!data) {
			return;
		}

		const index = prescription.details.findIndex((x) => x.id === e.detail);
		const newDetail = data.details.find((x) => x.id === e.detail);

		if (index >= 0 && newDetail) {
			prescription.details[index] = newDetail;
		}
	}

	async function searchMaterialFn(keyword: string): Promise<Selected<Material>[] | undefined> {
		if (!$userStore) {
			return;
		}

		const searchParams = new URLSearchParams();
		searchParams.set('page', '1');
		searchParams.set('size', '5');
		searchParams.set('materialType', '5');
		searchParams.set('materialName', keyword);

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

		const medicineIds = prescription.details.map((x) => x.medicineDetail.id);
		return data.data
			.filter((x) => !medicineIds.includes(x.id))
			.map((x) => ({
				label: x.name ?? '',
				value: x
			}));
	}

	async function printPrescription() {
		if (!$userStore || !browser) {
			return;
		}

		const printJS = (await import('print-js')).default;
		toast.promise(
			async (): Promise<void> => {
				const r = await fetch(endpoints.prescriptions.pdf(prescription.id), {
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				});

				if (!r.ok) {
					throw 'Không thể lấy được file pdf';
				}

				const data = await r.blob();
				URL.createObjectURL(data);
				printJS(URL.createObjectURL(data), 'pdf');
			},
			{
				loading: 'Đang tạo bản in...',
				success: 'Tạo bản in thành công',
				error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình tạo bản in'
			}
		);
	}
</script>

<div class="space-y-4 bg-white rounded-container-token shadow-md p-6 border">
	<div>
		<div class="flex gap-4 items-center mb-2">
			<p class="font-semibold text-2xl select-none mb-4">Đơn thuốc</p>
			<button
				type="button"
				class="btn bg-violet-500/20 ring-violet-500 ring-1 text-violet-900 rounded-container-token block ml-auto"
				on:click={printPrescription}
			>
				<i class="fa-solid fa-print"></i>
				<span class="font-medium">In đơn thuốc</span>
			</button>
		</div>
		<table class="w-full">
			<colgroup>
				<col class="w-12" />
				<col />
				<col />
				<col class="w-40" />
				<col />
				<col />
				{#if canEdit}
					<col />
				{/if}
			</colgroup>
			<thead>
				<tr class="border-b">
					<th class="border-b">#</th>
					<th class="text-start px-2 py-2">Tên thuốc</th>
					<th class="text-center px-2 py-2">Đơn vị</th>
					<th class="text-end px-2 py-2">Số lượng</th>
					<th class="text-start px-2 py-2">Liều dùng</th>
					{#if canEdit}
						<th class="w-auto"></th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each prescription.details as detail, i (detail.id)}
					<PrescriptionDetailRow
						index={i}
						{editPrescriptionDetailForm}
						bind:editMode={canEdit}
						prescriptionDetail={detail}
						{searchMaterialFn}
						prescriptionId={prescription.id}
						on:finishUpdate={onDetailFinishUpdate}
						on:finishDelete={onDetailFinishDelete}
					/>
				{/each}
				{#if canEdit}
					<tr class="*:align-top">
						<td class="py-2 text-center leading-[42px] text-success-500"
							>{prescription.details.length + 1}</td
						>
						<td class="px-2 py-2 align-top">
							<div>
								<Field form={createPrescriptionDetailForm} name="materialId">
									<Control>
										<SearchCombobox
											placeholder="Tên thuốc..."
											searchFn={searchMaterialFn}
											clearable
											bind:selected={selectedNewMaterial}
										></SearchCombobox>
									</Control>
									<FieldErrors class="text-sm mt-1" />
								</Field>
							</div>
						</td>
						<td class="px-2 py-2 align-top">
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
						<td class="px-2 py-2 align-top">
							<div>
								<Field form={createPrescriptionDetailForm} name="quantiy">
									<Control let:attrs>
										<NumberInput
											{...attrs}
											bind:value={$createPrescriptionDetailFormData.quantiy}
											step={selectedUnit?.value === false
												? selectedNewMaterial?.value.smallestUnitQuantity ?? 1
												: 1}
										/>
									</Control>
									<FieldErrors class="text-sm mt-1" />
								</Field>
							</div>
						</td>
						<td class="px-2 py-2 align-top">
							<div>
								<Field form={createPrescriptionDetailForm} name="dosage">
									<Control let:attrs>
										<textarea
											class="textarea flex-1 bg-white"
											rows="1"
											{...attrs}
											placeholder="Liều dùng..."
											bind:value={$createPrescriptionDetailFormData.dosage}
											use:autoHeightTextArea={{
												value: $createPrescriptionDetailFormData.dosage
											}}
										></textarea>
									</Control>
									<FieldErrors class="text-sm mt-1" />
								</Field>
							</div>
						</td>
						<td class="table-cell-fit py-2 align-top">
							<form use:createPrescriptionDetailFormEnhance method="post" class="flex gap-2">
								<button
									type="submit"
									class="btn variant-filled-primary rounded-container-token w-full"
								>
									<i class="fa-solid fa-add leading-6"></i>
								</button>
							</form>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
		{#if !canEdit && prescription.details.length === 0}
			<h2 class="h2 font-semibold text-surface-300 text-center py-4">Danh sách trống</h2>
		{/if}
	</div>
	<div>
		<p class="font-semibold text-2xl select-none mb-2">Nhắc nhở chung</p>
		<div>
			{#if !canEdit}
				{#if prescription.indication.trim()}
					{@const lines = prescription.indication.split(/\n|\r\n/g)}
					<div class="px-4 space-y-1">
						{#each lines as line}
							<p>{line}</p>
						{/each}
					</div>
				{:else}
					<h4 class="h4 font-semibold text-center text-surface-400">Lời nhắc trống</h4>
				{/if}
			{:else}
				<textarea
					class="textarea flex-1 bg-white"
					rows="3"
					placeholder="Lời nhắc..."
					bind:value={indication}
					use:autoHeightTextArea={{
						minRows: 2,
						value: indication
					}}
				></textarea>
			{/if}
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
				type="button"
				class="btn variant-filled-tertiary rounded-container-token ml-auto block"
				on:click={updateIndication}
			>
				<i class="fa-solid fa-floppy-disk"></i>
				<span>Lưu thay đổi</span>
			</button>
		</div>
	{/if}
</div>
