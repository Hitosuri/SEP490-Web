<script lang="ts">
	import endpoints from '$lib/endpoints';
	import { formatCompactDateTime } from '$lib/helpers/formatters';
	import { handleToastFetch } from '$lib/helpers/utils';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { Writable } from 'svelte/store';

	export let application: Application;
	export let showAsConfirm = false;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const modalStore = getModalStore();

	function confirmApplication() {
		if (!$userStore) {
			return;
		}

		toast.promise(
			handleToastFetch(
				fetch(endpoints.application.confirm(application.id), {
					method: 'PUT',
					headers: {
						'content-type': 'application/json',
						Authorization: `Bearer ${$userStore.token}`
					}
				}),
				{ success: 'Xác nhận đơn nghỉ thành công' },
				() => {
					$modalStore[0]?.response?.(true);
					modalStore.close();
				}
			),
			{
				loading: 'Đang xử lý...',
				success: (msg) => msg ?? 'Xác nhận đơn nghỉ thành công',
				error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình xác nhận đơn nghỉ'
			}
		);
	}
</script>

<div class="card bg-white p-6 w-full sm:w-5/6 md:w-3/4 lg:w-3/5 xl:w-1/2 2xl:w-[720px]">
	<div class="flex justify-between">
		<div class="text-2xl rounded-md border border-surface-200 size-14 text-center leading-[3.5rem]">
			<i class="fa-regular fa-file"></i>
		</div>
		<button
			class="btn-icon text-2xl !outline-none text-black/60 hover:text-black transition-colors"
			on:click={modalStore.close}
		>
			<i class="fa-solid fa-xmark"></i>
		</button>
	</div>
	<h1 class="font-semibold text-2xl mt-6">
		{#if showAsConfirm}
			Xác nhận đơn nghỉ
		{:else}
			Đơn nghỉ của {application.userName}
		{/if}
	</h1>
	<p class="font-semibold text-surface-400 mb-6">
		{#if showAsConfirm}
			Bạn có chắn muốn xác nhận đơn nghỉ của {application.userName}
		{/if}
	</p>
	<div class="grid grid-cols-2 gap-4">
		<div>
			<p class="text-xs sm:text-sm font-semibold text-surface-500 select-none">Nghỉ từ</p>
			<p class="text-lg sm:text-xl font-medium tracking-wide overflow-hidden text-ellipsis">
				{formatCompactDateTime(application.startAt)}
			</p>
		</div>
		<div>
			<p class="text-xs sm:text-sm font-semibold text-surface-500 select-none">Nghỉ từ</p>
			<p class="text-lg sm:text-xl font-medium tracking-wide overflow-hidden text-ellipsis">
				{formatCompactDateTime(application.endAt)}
			</p>
		</div>
		{#if application.reason?.trim()}
			{@const lines = application.reason.split(/\n|\r\n/g)}
			<div>
				<p class="text-xs sm:text-sm font-semibold text-surface-500 select-none">Lý do nghỉ</p>
				<div class="px-4 space-y-1">
					{#each lines as line}
						<p>{line}</p>
					{/each}
				</div>
			</div>
		{/if}
		{#if showAsConfirm}
			<div class="col-span-2 flex gap-4 mt-4 font-medium *:btn *:rounded-container-token *:flex-1">
				<button type="button" class="variant-soft-surface" on:click={modalStore.close}>
					<i class="fa-solid fa-delete-left"></i>
					<span class="pl-1">Huỷ</span>
				</button>
				<button type="submit" class="variant-filled-primary" on:click={confirmApplication}>
					{#if application}
						<i class="fa-solid fa-check"></i>
					{:else}
						<i class="fa-solid fa-plus"></i>
					{/if}
					<span class="pl-1">Xác nhận</span>
				</button>
			</div>
		{/if}
	</div>
</div>
