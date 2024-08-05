<script lang="ts" generics="T">
	import { twMerge } from 'tailwind-merge';
	import { Combobox, type Selected } from 'bits-ui';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';

	export let searchFn: (keyword: string) => Promise<Selected<T>[] | undefined>;
	export let searchDelay = 400;
	export let selected: Selected<T> | undefined = undefined;
	export let clearable = false;
	export let regionInput: string | undefined = undefined;
	export let regionWrapper: string | undefined = undefined;
	export let placeholder: string = '';

	let items: Selected<T>[] = [];
	let itemSearchInput = '';
	let lastItemSearchInput: string | undefined;
	let itemSearchOpen = false;
	let itemFirstOpen = false;
	let itemSearchTimer: NodeJS.Timeout;
	let trigger: number = Math.random();

	$: cRegionInput = `input rounded-container-token ${showClear ? 'pr-[42px]' : ''}`;
	$: cRegionWrapper = 'relative';
	$: classesRegionInput = twMerge(cRegionInput, regionInput);
	$: classesRegionWrapper = twMerge(cRegionWrapper, regionWrapper);
	$: onItemSearchOpen(itemSearchOpen);
	$: itemSearch(itemSearchInput);
	$: showClear = !!(clearable && selected);
	$: onSelectedChange(selected);

	function onSelectedChange(newSelected: Selected<T> | undefined) {
		if (!newSelected) {
			clear();
		}
	}

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

	function clear() {
		itemSearchInput = '';
		lastItemSearchInput = undefined;
		selected = undefined;
		trigger = Math.random();
		items = [];
		itemFirstOpen = false;
	}
</script>

{#key trigger}
	<Combobox.Root {items} bind:inputValue={itemSearchInput} bind:open={itemSearchOpen} bind:selected>
		<div class={classesRegionWrapper}>
			<Combobox.Input class={classesRegionInput} {placeholder} />
			{#if showClear}
				<div
					class="flex items-center justify-center absolute right-0 top-0 bottom-0 aspect-square"
					transition:fade={{ duration: 200 }}
				>
					<button
						type="button"
						class="size-6 btn-icon hover:variant-soft-error rounded-md top-[9px]"
						on:click={clear}
					>
						<i class="fa-solid fa-xmark"></i>
					</button>
				</div>
			{/if}
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
{/key}
