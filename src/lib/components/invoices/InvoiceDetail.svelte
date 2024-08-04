<script lang="ts">
	import endpoints from '$lib/endpoints';
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import Loading from '../common/Loading.svelte';

	export let recordId: number;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	let invoice: Promise<PaymentDetail> | undefined;

	onMount(() => {
		invoice = getInvoice(recordId);
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
</script>

<div class="card bg-white p-6 w-full md:w-5/6 lg:w-4/5 xl:w-3/4 2xl:w-[1280px]">
	{#if invoice}
		{#await invoice}
			<Loading class="mx-auto my-16" />
		{:then data}
			<div class="flex">
				<div class="flex-1 flex-shrink-0">
					<p>{data.patient.name}</p>
				</div>
				<div class="border-l h-full flex flex-col gap-y-4 pl-4">
					<button type="button" class="btn variant-filled-primary rounded-container-token">
						Xác nhận đã thanh toán
					</button>
					<button type="button" class="btn variant-soft-surface rounded-container-token">
						---
					</button>
				</div>
			</div>
		{:catch error}
			<p>{error}</p>
		{/await}
	{/if}
</div>
