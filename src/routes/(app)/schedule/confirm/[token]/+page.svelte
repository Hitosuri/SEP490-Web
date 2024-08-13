<script lang="ts">
	import Container from '$lib/components/common/Container.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Xác nhận lịch hẹn</title>
</svelte:head>
<Container paddingTopHeader heightScreenMin class="py-4 flex flex-col justify-center items-center">
	{#if data.errorMsg}
		<p class="text-2xl font-semibold text-error-500 mb-4">{data.errorMsg}</p>
		<a href="/" class="btn variant-filled-primary">Trở về trang chủ</a>
	{:else}
		{#if data.confirmed}
			<p class="text-4xl font-semibold text-success-500">Xác nhận lịch hẹn thành công</p>
		{:else}
			<p class="text-4xl font-semibold text-slate-500">Từ chối lịch hẹn thành công</p>
		{/if}
		<div class="mt-4 font-medium flex gap-4">
			<a href="/" class="btn variant-filled-primary">Trở về trang chủ</a>
			<button type="button" class="btn variant-filled-surface" on:click={() => window.close()}>
				Đóng trang
			</button>
		</div>
	{/if}
</Container>
