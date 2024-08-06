<script lang="ts">
	import endpoints from '$lib/endpoints';
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import Loading from '../common/Loading.svelte';
	import { RecordStatus } from '$lib/constants/record-constant';
	import { formatCurrency } from '$lib/helpers/formatters';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { toast } from 'svelte-sonner';

	export let payment: Payment;

	const modalStore = getModalStore();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	let invoice: Promise<PaymentDetail> | undefined;

	onMount(() => {
		invoice = getInvoice(payment.recordId);
	});

	async function getInvoice(id: number): Promise<PaymentDetail> {
		if (!$userStore) {
			throw 'Bạn chưa đăng nhập';
		}
		const r = await fetch(endpoints.payment.detail(id), {
			headers: {
				Authorization: `Bearer ${$userStore.token}`
			}
		});

		if (!r.ok) {
			throw 'Đã có lỗi xảy ra';
		}

		const data: ApiResponse<PaymentDetail> = await r.json();

		return data.body!;
	}

	async function confirm() {
		if (!$userStore) {
			return;
		}

		toast.promise(
			async (): Promise<string> => {
				const response = await fetch(endpoints.payment.confirm(payment.recordId), {
					method: 'PUT',
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				});

				if (!response.ok) {
					return Promise.reject();
				}
				closeModal(true);
				return 'Xác nhận thanh toán thành công';
			},
			{
				loading: 'Đang xử lý...',
				success: (msg) => msg ?? 'Xác nhận thanh toán thành công',
				error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình xác nhận thanh toán'
			}
		);
	}

	async function reset() {}

	function closeModal(state: boolean = false) {
		$modalStore[0]?.response?.(state);
		modalStore.close();
	}
</script>

<div class="card bg-white p-6 w-full md:w-5/6 lg:w-4/5 xl:w-3/4 2xl:w-[1280px]">
	{#if invoice}
		{#await invoice}
			<Loading class="mx-auto my-16" />
		{:then data}
			<div class="flex gap-4">
				<div
					class="flex-1 flex-shrink-0 space-y-6 {payment.status === RecordStatus.WAITTINGPAYMENT
						? 'border-r pr-4'
						: ''}"
				>
					<div class="flex">
						<div class="space-y-2 flex-1">
							<p class="text-xl">
								<span class="font-semibold text-surface-500">Bệnh nhân:</span>
								<span class="font-bold">{data.patient.name}</span>
							</p>
							{#if data.patient.phone}
								<p class="text-lg">
									<span class="font-medium text-surface-500">Số điện thoại:</span>
									<span class="font-semibold">{data.patient.phone}</span>
								</p>
							{/if}
							{#if data.patient.phone}
								<p class="text-lg">
									<span class="font-medium text-surface-500">Email:</span>
									<span class="font-semibold">{data.patient.email}</span>
								</p>
							{/if}
							<p class="text-lg">
								<span class="font-medium text-surface-500">Trạng thái:</span>
								{#if payment.status === RecordStatus.WAITTINGPAYMENT}
									<span class="font-semibold text-warning-500">Chưa thanh toán</span>
								{:else if payment.status === RecordStatus.END}
									<span class="font-semibold text-success-500">Đã thanh toán</span>
								{/if}
							</p>
						</div>
						{#if payment.status === RecordStatus.END}
							<div>
								<button
									type="button"
									class="btn-icon variant-filled-error rounded-container-token"
									on:click={() => closeModal()}
								>
									<i class="fa-solid fa-xmark"></i>
								</button>
							</div>
						{/if}
					</div>
					<div>
						<table class="w-full">
							<thead>
								<tr class="bg-slate-200">
									<th class="p-2">#</th>
									<th class="p-2 text-start">Dịch vụ</th>
									<th class="p-2 text-end">Đơn giá</th>
									<th class="p-2 text-end">Số lượng</th>
									<th class="p-2 text-end">Thành tiền</th>
								</tr>
							</thead>
							<tbody>
								{#each data.treatments as treatment, i (treatment.id)}
									<tr class="border-b">
										<td class="p-2 text-center">{i + 1}</td>
										<td class="p-2">{treatment.name}</td>
										<td class="p-2 text-end">{formatCurrency(treatment.price)}</td>
										<td class="p-2 text-end">{treatment.quantity}</td>
										<td class="p-2 text-end font-bold text-black/60">
											{formatCurrency(treatment.totalCost)}
										</td>
									</tr>
								{/each}
								<tr>
									<td colspan="3"></td>
									<td class="p-2 text-end text-lg font-bold text-sky-500">Tổng</td>
									<td class="p-2 text-end font-bold text-lg text-primary-700">
										{formatCurrency(data.totalTreatmentAmount)}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div>
						<table class="w-full">
							<thead>
								<tr class="bg-slate-200">
									<th class="p-2">#</th>
									<th class="p-2 text-start">Vật tư</th>
									<th class="p-2 text-start">Đơn vị</th>
									<th class="p-2 text-end">Số lượng</th>
									<th class="p-2 text-end">Thành tiền</th>
								</tr>
							</thead>
							<tbody>
								{#each data.extraMaterials as material, i (material.id)}
									<tr class="border-b">
										<td class="p-2 text-center">{i + 1}</td>
										<td class="p-2">{material.name}</td>
										<td class="p-2">{material.unit}</td>
										<td class="p-2 text-end">{material.quantity}</td>
										<td class="p-2 text-end font-bold text-black/60">
											{formatCurrency(material.price)}
										</td>
									</tr>
								{/each}
								<tr>
									<td colspan="3"></td>
									<td class="p-2 text-end text-lg font-bold text-sky-500">Tổng</td>
									<td class="p-2 text-end font-bold text-lg text-primary-700">
										{formatCurrency(data.totalExtraMaterial)}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div class="border-t">
						<table class="mx-auto">
							<thead>
								<tr>
									<th class="py-2 px-8 text-start">Giảm giá</th>
									<th class="py-2 px-8 text-start">Tổng tiền</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="py-2 px-8 text-start text-2xl font-bold text-primary-700">
										{formatCurrency(data.deduction)}
									</td>
									<td class="py-2 px-8 text-start text-2xl font-bold text-primary-700">
										{formatCurrency(data.totalAmount)}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
				{#if payment.status === RecordStatus.WAITTINGPAYMENT}
					<div class="h-full flex flex-col gap-y-4">
						<button
							type="button"
							class="btn variant-filled-primary rounded-container-token font-semibold"
							on:click={confirm}
						>
							Xác nhận đã thanh toán
						</button>
						<button
							type="button"
							class="btn variant-soft-tertiary rounded-container-token font-semibold"
							on:click={reset}
						>
							Chuyển hồ sơ về bác sĩ
						</button>
						<button
							type="button"
							class="btn variant-soft-surface rounded-container-token font-semibold"
							on:click={() => closeModal()}
						>
							Đóng
						</button>
					</div>
				{/if}
			</div>
		{:catch error}
			<p>{error}</p>
		{/await}
	{/if}
</div>
