<script lang="ts" generics="T extends Record<string, any>, K">
	import { Checkbox, DropdownMenu, Pagination } from 'bits-ui';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import Loading from './Loading.svelte';
	import CustomPagination from './CustomPagination.svelte';

	export let items: T[];
	export let fields: TableField<T>[];
	export let pageSize = 10;
	export let currentPage = 1;
	export let totalItems = items.length;
	export let sortingField: keyof T | undefined = undefined;
	export let sortingAscending = false;
	export let showDetail: ((item: T) => string) | undefined = undefined;
	export let detailEmitEvent = false;
	export let showEdit = true;
	export let showDelete = true;
	export let loading = false;
	export let actionMenu: {
		icon: string;
		label: string;
		click?: (item: T) => void;
		showWhen?: (item: T) => boolean;
		showBelow?: boolean;
	}[] = [];
	export let groupFn: ((item: T) => K) | undefined = undefined;
	export let shadow = true;
	export let showSelection = false;

	const dispatch = createEventDispatcher<{
		pageChange: number;
		sortField: keyof T | undefined;
		detail: T;
		edit: T;
		delete: T;
	}>();
	let selectedAllState: boolean | 'indeterminate' = false;
	let extendedItems = items.map((x, i) => ({
		item: x,
		id: i + 1,
		selected: false
	}));
	let first = true;
	let topGroupItem: Map<T, K> | undefined;

	$: topGroupItem = extractTopGroupItem(items);
	$: selectedUserCount = extendedItems.filter((x) => x.selected).length;
	$: openBatchMenu = selectedUserCount > 0;
	$: {
		if (selectedUserCount === 0) {
			selectedAllState = false;
		} else if (selectedUserCount === extendedItems.length) {
			selectedAllState = true;
		} else {
			selectedAllState = 'indeterminate';
		}
	}
	$: changeItems(items);

	function extractTopGroupItem(items: T[]): Map<T, K> | undefined {
		if (!groupFn) {
			return;
		}
		const result: Map<T, K> = new Map();
		const groups: Set<K> = new Set();

		items.forEach((item) => {
			const group = groupFn(item);

			if (!groups.has(group)) {
				groups.add(group);
				result.set(item, group);
			}
		});

		return result;
	}

	function changeItems(items: T[]) {
		if (first) {
			first = false;
			return;
		}
		extendedItems = items.map((x, i) => ({
			item: x,
			id: i + 1,
			selected: false
		}));
	}

	function onSelectedAllStateChanged(checked: boolean | 'indeterminate') {
		if (typeof checked === 'boolean') {
			extendedItems.forEach((x) => {
				x.selected = checked;
			});
		}
	}
</script>

<div class="relative">
	<div
		class="bg-white p-2 rounded-xl overflow-x-auto {shadow
			? 'shadow-md'
			: ''} relative transition-all duration-200 {loading ? 'blur-[2px]' : 'blur-0'}"
	>
		<table class="w-full">
			<thead>
				<tr class="text-sm *:bg-slate-100 *:font-semibold *:text-surface-400">
					{#if showSelection}
						<th class="text-[0] table-cell-fit rounded-tl-lg rounded-bl-lg !pl-6">
							<Checkbox.Root
								class="checkbox {selectedAllState
									? 'bg-primary-500 border-none'
									: 'bg-white'} -translate-x-[2px] block"
								bind:checked={selectedAllState}
								onCheckedChange={onSelectedAllStateChanged}
							>
								<Checkbox.Indicator
									let:isChecked
									let:isIndeterminate
									class="*:block text-white text-sm"
								>
									{#if isChecked}
										<i class="fa-solid fa-check"></i>
									{:else if isIndeterminate}
										<i class="fa-solid fa-minus"></i>
									{/if}
								</Checkbox.Indicator>
							</Checkbox.Root>
						</th>
					{:else}
						<th class="table-cell-fit rounded-tl-lg rounded-bl-lg !pl-6 text-start">#</th>
					{/if}
					{#each fields as field}
						{#if field.sortable}
							<th
								class={field.align === 'right'
									? 'text-end'
									: field.align === 'left'
										? 'text-start'
										: 'text-center'}
							>
								<button
									class="btn btn-sm px-4 py-2 hover:text-surface-700 h-9"
									on:click={() => dispatch('sortField', field.name)}
								>
									<span>{field.displayName}</span>
									<div class="relative">
										<i
											class="fa-solid fa-sort-up leading-5 {sortingField === field.name &&
											sortingAscending
												? 'text-primary-500'
												: 'opacity-40'}"
										></i>
										<i
											class="fa-solid fa-sort-down absolute top-0 left-0 leading-5 {sortingField ===
												field.name && !sortingAscending
												? 'text-primary-500'
												: 'opacity-40'}"
										></i>
									</div>
								</button>
							</th>
						{:else}
							<th
								class="select-none px-4 py-2 {field.align === 'right'
									? 'text-end'
									: field.align === 'left'
										? 'text-start'
										: 'text-center'}">{field.displayName}</th
							>
						{/if}
					{/each}
					<th class="rounded-tr-lg rounded-br-lg w-0">
						<button
							class="btn btn-sm px-4 py-2 hover:text-surface-700 h-9"
							on:click={() => dispatch('sortField', undefined)}
						>
							<i class="fa-solid fa-arrow-rotate-left"></i>
						</button>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each extendedItems as extendedItem, i (extendedItem.id)}
					{@const group = topGroupItem?.get(extendedItem.item)}
					{#if group && !sortingField}
						<tr></tr>
						<tr>
							<td colspan={fields.length + 2}>
								<slot name="group-label" {group} item={extendedItem.item}>
									<div
										class="text-center pt-4 pb-1 font-semibold text-sm mx-4 {i % 2 == 0
											? 'border-b'
											: ''}"
									>
										{String(group)}
									</div>
								</slot>
							</td>
						</tr>
					{/if}
					{@const href =
						showDetail && !detailEmitEvent ? { detailUrl: showDetail(extendedItem.item) } : {}}
					<tr class="*:even:bg-slate-100 *:py-4 *:px-4 group">
						{#if showSelection}
							<td class="rounded-tl-lg rounded-bl-lg text-[0] relative overflow-hidden !pl-6">
								<input
									class="checkbox bg-white size-4"
									type="checkbox"
									name=""
									bind:checked={extendedItem.selected}
								/>
								<div
									class="absolute w-1 rounded-full h-2/3 left-2 top-1/2 -translate-y-1/2 bg-primary-400 {extendedItem.selected
										? 'block'
										: 'hidden'}"
								></div>
							</td>
						{:else}
							<td
								class="rounded-tl-lg rounded-bl-lg relative overflow-hidden !pl-6 text-surface-400 font-semibold"
							>
								{i + 1}
							</td>
						{/if}
						{#each fields as field}
							{@const content =
								field.formatter?.(extendedItem.item[field.name]) ??
								extendedItem.item[field.name] ??
								''}
							<slot fieldData={extendedItem.item} {field}>
								<td
									title={String(content)}
									class="{field.ellipsis ? 'cell-ellipsis' : ''} {field.align === 'right'
										? 'text-end'
										: field.align === 'left'
											? 'text-start'
											: 'text-center'} {field.classes ?? ''}"
								>
									{#if typeof content === 'boolean'}
										<input type="checkbox" value={content} disabled class="checkbox bg-white" />
									{:else if field.href}
										<a href={field.href(extendedItem.item)} class="hover:underline">
											{content}
										</a>
									{:else}
										{content}
									{/if}
								</td>
							</slot>
						{/each}
						<td class="rounded-tr-lg rounded-br-lg !py-0">
							<slot name="action-cell" item={extendedItem.item}>
								{#if showDetail || detailEmitEvent || showEdit || showDelete || actionMenu.filter( (x) => (!x.showWhen ? true : x.showWhen(extendedItem.item)) ).length > 0}
									<DropdownMenu.Root preventScroll={false}>
										<DropdownMenu.Trigger
											class="btn text-xl p-0 size-9 text-surface-400 hover:variant-soft-primary transition-all"
										>
											<i class="fa-solid fa-ellipsis"></i>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content
											transition={fly}
											transitionConfig={{
												duration: 200,
												y: 30,
												easing: cubicOut
											}}
											sideOffset={8}
											class="w-fit rounded-md border border-surface-100 bg-white p-1 shadow-lg"
										>
											{#if showDetail && !detailEmitEvent}
												<DropdownMenu.Item
													href={href.detailUrl}
													class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 data-[disabled]:pointer-events-none data-[disabled]:text-surface-300 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
												>
													<div class="size-4 text-center">
														<i class="fa-solid fa-circle-info block"></i>
													</div>
													<span class="font-semibold text-sm leading-4">Chi tiết</span>
												</DropdownMenu.Item>
											{/if}
											{#if detailEmitEvent}
												<DropdownMenu.Item
													on:click={() => dispatch('detail', extendedItem.item)}
													class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 data-[disabled]:pointer-events-none data-[disabled]:text-surface-300 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
												>
													<div class="size-4 text-center">
														<i class="fa-solid fa-circle-info block"></i>
													</div>
													<span class="font-semibold text-sm leading-4">Chi tiết</span>
												</DropdownMenu.Item>
											{/if}
											{#if (showDetail || detailEmitEvent) && (showEdit || showDelete)}
												<DropdownMenu.Separator class="my-1 -ml-1 -mr-1 block h-px bg-surface-50" />
											{/if}
											{#if actionMenu.length > 0}
												{#each actionMenu as action (action)}
													{#if !action.showBelow && (!action.showWhen || action.showWhen(extendedItem.item))}
														<DropdownMenu.Item
															on:click={() => action.click?.(extendedItem.item)}
															class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 data-[disabled]:pointer-events-none data-[disabled]:text-surface-300 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
														>
															<div class="size-4 text-center">
																<i class="{action.icon} block"></i>
															</div>
															<span class="font-semibold text-sm leading-4">{action.label}</span>
														</DropdownMenu.Item>
													{/if}
												{/each}
												{#if (showDetail || detailEmitEvent) && (showEdit || showDelete)}
													<DropdownMenu.Separator
														class="my-1 -ml-1 -mr-1 block h-px bg-surface-50"
													/>
												{/if}
											{/if}
											{#if showEdit}
												<DropdownMenu.Item
													on:click={() => dispatch('edit', extendedItem.item)}
													class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 data-[disabled]:pointer-events-none data-[disabled]:text-surface-300 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
												>
													<div class="size-4 text-center">
														<i class="fa-regular fa-pen-to-square block"></i>
													</div>
													<span class="font-semibold text-sm leading-4">Sửa</span>
												</DropdownMenu.Item>
											{/if}
											{#if showDelete}
												<DropdownMenu.Item
													on:click={() => dispatch('delete', extendedItem.item)}
													class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 data-[disabled]:pointer-events-none data-[disabled]:text-surface-300 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
												>
													<div class="size-4 text-center">
														<i class="fa-regular fa-trash-can block"></i>
													</div>
													<span class="font-semibold text-sm leading-4">Xoá</span>
												</DropdownMenu.Item>
											{/if}
											{#if actionMenu.length > 0}
												{#if (showDetail || detailEmitEvent) && (showEdit || showDelete)}
													<DropdownMenu.Separator
														class="my-1 -ml-1 -mr-1 block h-px bg-surface-50"
													/>
												{/if}
												{#each actionMenu as action (action)}
													{#if action.showBelow && (!action.showWhen || action.showWhen(extendedItem.item))}
														<DropdownMenu.Item
															on:click={() => action.click?.(extendedItem.item)}
															class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 data-[disabled]:pointer-events-none data-[disabled]:text-surface-300 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
														>
															<div class="size-4 text-center">
																<i class="{action.icon} block"></i>
															</div>
															<span class="font-semibold text-sm leading-4">{action.label}</span>
														</DropdownMenu.Item>
													{/if}
												{/each}
											{/if}
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								{/if}
							</slot>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if loading}
			<div
				transition:fade={{ duration: 200 }}
				class="w-full h-full rounded-xl absolute top-0 left-0 bg-black/30"
			></div>
		{/if}
	</div>
	{#if loading}
		<div
			transition:fade={{ duration: 200 }}
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
		>
			<Loading />
		</div>
	{/if}
</div>
{#if totalItems > pageSize}
	<CustomPagination {totalItems} {pageSize} bind:currentPage on:pageChange />
{/if}
{#if openBatchMenu}
	<div
		transition:fly={{
			duration: 200,
			y: 20,
			easing: cubicOut
		}}
		class="fixed p-4 bg-surface-900 left-1/2 bottom-8 -translate-x-1/2 flex items-center rounded-full gap-4"
	>
		<button
			on:click={() => (openBatchMenu = false)}
			class="btn-icon text-surface-400 hover:text-white hover:variant-soft-surface transition-all"
		>
			<i class="fa-solid fa-xmark"></i>
		</button>
		<div class="text-white">
			<span>Đã chọn</span>
			<span class="badge variant-soft-surface text-white px-3">{selectedUserCount}</span>
			<span>nhân viên</span>
		</div>
		<button class="btn variant-soft-surface text-white ml-10">
			<i class="fa-regular fa-pen-to-square text-xl text-surface-400"></i>
			<span>Sửa</span>
		</button>
		<button class="btn variant-filled-error">
			<i class="fa-regular fa-trash-can text-xl text-error-300"></i>
			<span>Xoá</span>
		</button>
	</div>
{/if}
