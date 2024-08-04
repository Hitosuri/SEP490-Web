<script lang="ts">
	import { Pagination } from 'bits-ui';
	import { createEventDispatcher } from 'svelte';

	export let currentPage = 1;
	export let totalItems = 0;
	export let pageSize = 10;

	const dispatch = createEventDispatcher<{ pageChange: number }>();

	$: paginationBinding = currentPage;
</script>

<Pagination.Root
	count={totalItems}
	bind:page={paginationBinding}
	perPage={pageSize}
	let:pages
	let:range
	onPageChange={(page) => dispatch('pageChange', page)}
>
	<div class="flex items-center justify-center">
		<Pagination.PrevButton
			class="mr-6 size-8 rounded-xl duration-200 bg-slate-200 hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-surface-400"
		>
			<i class="fa-solid fa-chevron-left"></i>
		</Pagination.PrevButton>
		<div class="flex items-center gap-3">
			{#each pages as page (page.key)}
				{#if page.type === 'ellipsis'}
					<div class="text-lg font-medium">...</div>
				{:else}
					<Pagination.Page
						{page}
						class="size-10 rounded-xl duration-200 bg-slate-300 hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-surface-400 data-[selected]:border data-[selected]:font-semibold data-[selected]:bg-white data-[selected]:shadow-md select-none"
					>
						{page.value}
					</Pagination.Page>
				{/if}
			{/each}
		</div>
		<Pagination.NextButton
			class="ml-6 size-8 rounded-xl duration-200 bg-slate-200 hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-surface-400"
		>
			<i class="fa-solid fa-chevron-right"></i>
		</Pagination.NextButton>
	</div>
	<p class="text-center text-[13px] text-muted-foreground mt-6">
		Hiển thị {range.start} - {range.end}
	</p>
</Pagination.Root>
