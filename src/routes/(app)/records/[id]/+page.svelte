<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { PageData } from './$types';
	import type { Writable } from 'svelte/store';
	import PrescriptionInRecord from '$lib/components/prescriptions/PrescriptionInRecord.svelte';
	import endpoints from '$lib/endpoints';
	import ExaminationContent from '$lib/components/records/ExaminationContent.svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { RecordStatus } from '$lib/constants/record-constant';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import Container from '$lib/components/common/Container.svelte';
	import usingSubFeature from '$lib/stores/using-subfeature-store';

	export let data: PageData;
	console.log(data);

	const modalStore = getModalStore();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const record = data.record;
	let prescription: Prescription | undefined = data.prescription;

	onMount(() => {
		usingSubFeature.set([
			{
				active: true,
				title: 'Hồ sơ nha khoa',
				faIcon: 'fa-solid fa-folder-open'
			}
		]);
	});

	async function createPrescription() {
		if (!$userStore) {
			return;
		}

		const r = await fetch(endpoints.prescriptions.create, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				Authorization: `Bearer ${$userStore.token}`
			},
			body: JSON.stringify({
				date: new Date(),
				indication: '-',
				recordId: data.recordId
			})
		});

		const prescriptionIdData: ApiResponse<number> = await r.json();
		const prescriptionId = prescriptionIdData.body!;

		const presResponse = await fetch(endpoints.prescriptions.get(prescriptionId), {
			headers: {
				Authorization: `Bearer ${$userStore.token}`
			}
		});

		const prescriptionData: ApiResponse<Prescription> = await presResponse.json();

		if (!prescriptionData.body) {
			return;
		}

		record.prescriptionId = prescriptionId;
		prescription = prescriptionData.body;
		prescription.indication = prescription.indication === '-' ? '' : prescription.indication;
	}

	async function closeRecord() {
		if (!$userStore) {
			return;
		}

		const modalSetting: ModalSettings = {
			type: 'confirm',
			title: 'Xác nhận đóng hồ sơ',
			body: `Xác nhận đóng hồ sơ của bệnh nhân ${record.patient.name}`,
			response: (r) => {
				if (!r || !$userStore) {
					return;
				}

				toast.promise(
					async (): Promise<string> => {
						const response = await fetch(endpoints.records.end(data.recordId), {
							method: 'PUT',
							headers: {
								Authorization: `Bearer ${$userStore.token}`
							}
						});

						if (!response.ok) {
							const data: ApiResponse<undefined, string[]> = await response.json();

							return Promise.reject(data.error?.join(', '));
						}
						goto('/');
						return 'Đã đóng hồ sơ, chuyển sang trạng thái chờ thanh toán';
					},
					{
						loading: 'Đang xử lý...',
						success: (msg) => msg ?? 'Đã đóng hồ sơ, chuyển sang trạng thái chờ thanh toán',
						error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình đóng hồ sơ khám'
					}
				);
			}
		};
		modalStore.trigger(modalSetting);
	}
</script>

<svelte:head>
	<title>Hồ sơ bệnh án - {record.patient.name}</title>
</svelte:head>
<Container paddingTopHeader heightFull class="py-4 space-y-6">
	<div class="flex gap-x-4">
		{#if record.anotherPersonDto}
			<div class="bg-white rounded-container-token shadow-md p-6 border flex-1">
				<p class="font-semibold text-2xl select-none mb-4">Bệnh nhân</p>
				<div class="space-y-2">
					<p class="text-lg">
						<span class="font-medium text-surface-500">Tên:</span>
						<span class="font-semibold">{record.anotherPersonDto.createForPatientName}</span>
					</p>
					<p class="text-lg">
						<span class="font-medium text-surface-500">Tuổi:</span>
						<span class="font-semibold">{record.anotherPersonDto.createForPatientAge}</span>
					</p>
					<p class="text-lg">
						<span class="font-medium text-surface-500">Quan hệ với người giám hộ:</span>
						<span class="font-semibold">{record.anotherPersonDto.relationWithCurrentPatient}</span>
					</p>
					{#if record.anotherPersonDto.noteForPatientCreatedBy?.trim()}
						<p class="text-lg">
							<span class="font-medium text-surface-500">Ghi chú:</span>
							<span class="font-medium">{record.anotherPersonDto.noteForPatientCreatedBy}</span>
						</p>
					{/if}
				</div>
			</div>
		{/if}
		<div class="bg-white rounded-container-token shadow-md p-6 border flex-1">
			<p class="font-semibold text-2xl select-none mb-4">
				{record.anotherPersonDto ? 'Giám hộ' : 'Bệnh nhân'}
			</p>
			<div class="space-y-2">
				<p class="text-lg">
					<span class="font-medium text-surface-500">Tên:</span>
					<span class="font-semibold">{record.patient.name}</span>
				</p>
				<p class="text-lg">
					<span class="font-medium text-surface-500">Số điện thoại:</span>
					<span class="font-semibold">{record.patient.phone}</span>
				</p>
			</div>
		</div>
	</div>
	<ExaminationContent
		editRecordForm={data.editRecordForm}
		recordId={data.recordId}
		record={data.record}
		extraMaterials={data.prefetchExtraMaterials}
	/>
	{#if prescription}
		<PrescriptionInRecord
			{prescription}
			editPrescriptionDetailForm={data.editPrescriptionDetailForm}
			{record}
		/>
	{:else}
		<p class="font-semibold text-surface-500 text-xl select-none mb-1">
			<span>Đơn thuốc:</span>
			<span class="text-error-400">Chưa có đơn thuốc</span>
		</p>
		{#if record.status === RecordStatus.PROCESSING}
			<button
				class="btn variant-soft-primary shadow-md btn-lg font-medium px-12 mx-auto block"
				on:click={createPrescription}
			>
				<i class="fa-regular fa-prescription-bottle"></i>
				<span>Tạo đơn thuốc</span>
			</button>
		{/if}
	{/if}
	{#if record.status === RecordStatus.PROCESSING}
		<button
			type="button"
			class="btn variant-filled-tertiary btn-lg w-full rounded-container-token"
			on:click={closeRecord}
		>
			Đóng hồ sơ
		</button>
	{/if}
</Container>
