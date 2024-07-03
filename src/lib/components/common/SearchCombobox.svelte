<script lang="ts" generics="T">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { Combobox, type Selected } from 'bits-ui';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	interface $$Props extends HTMLInputAttributes {
		searchFn: (keyword: string) => Promise<Selected<T>[] | undefined>;
		searchDelay?: number;
		selected?: Selected<T>;
	}

	export let searchFn: (keyword: string) => Promise<Selected<T>[] | undefined>;
	export let searchDelay = 400;
	export let selected: Selected<T> | undefined = undefined;

	let items: Selected<T>[] = [];
	let itemSearchInput = '';
	let lastItemSearchInput: string;
	let itemSearchOpen = false;
	let itemFirstOpen = false;
	let itemSearchTimer: NodeJS.Timeout;

	$: onItemSearchOpen(itemSearchOpen);
	$: itemSearch(itemSearchInput);

	function onItemSearchOpen(open: boolean) {
		if (!open) {
			return;
		}
		if (itemFirstOpen) {
			return;
		}

		itemFirstOpen = true;
		itemSearch('');
	}

	function itemSearch(input: string) {
		if (!itemFirstOpen) {
			return;
		}
		const keyword = input.trim();

		if (itemSearchTimer) {
			clearTimeout(itemSearchTimer);
		}

		itemSearchTimer = setTimeout(async () => {
			if (keyword === lastItemSearchInput) {
				return;
			}

			const result = await searchFn(keyword);

			if (result) {
				items = result;
			}
			lastItemSearchInput = keyword;
		}, searchDelay);
	}
</script>

<Combobox.Root {items} bind:inputValue={itemSearchInput} bind:open={itemSearchOpen} bind:selected>
	<div class="relative">
		<Combobox.Input {...$$restProps} />
	</div>

	<Combobox.Content
		class="w-full !min-w-fit rounded-md border border-surface-100 bg-white p-1 shadow-lg z-[999]"
		transition={fly}
		transitionConfig={{
			duration: 200,
			y: 30,
			easing: cubicOut
		}}
		sideOffset={8}
	>
		{#each items as item}
			<Combobox.Item
				class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-2 rounded select-none flex gap-3 items-center cursor-pointer"
				value={item.value}
				label={item.label}
			>
				<slot itemData={item}>
					<div>{item.label}</div>
				</slot>
				<Combobox.ItemIndicator class="ml-auto" asChild={false}>
					<i class="fa-solid fa-check text-primary-500"></i>
				</Combobox.ItemIndicator>
			</Combobox.Item>
		{:else}
			<span class="block px-5 py-2 text-sm text-muted-foreground">Không có kết quả</span>
		{/each}
	</Combobox.Content>
</Combobox.Root>
