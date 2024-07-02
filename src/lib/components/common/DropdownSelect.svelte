<script lang="ts" generics="T, Multiple extends boolean = false">
	import { twMerge } from 'tailwind-merge';

	import { Select, type Selected } from 'bits-ui';
	import { type ComponentProps } from 'svelte';

	interface $$Props extends ComponentProps<Select.Root<T, Multiple>> {
		regionInput?: string;
	}

	export let items: Selected<T>[] | undefined = undefined;
	export let open: ComponentProps<Select.Root<T, Multiple>>['open'] = undefined;
	export let selected: ComponentProps<Select.Root<T, Multiple>>['selected'] = undefined;
	export let regionInput = '';

	const cRegionInput = 'btn bg-white rounded-md';

	$: classesRegionInput = twMerge(cRegionInput, regionInput);
</script>

<Select.Root {items} bind:selected bind:open {...$$restProps}>
	<Select.Trigger class={classesRegionInput}>
		<slot ValueComponent={Select.Value}>
			<Select.Value class="font-medium" />
		</slot>
	</Select.Trigger>

	<Select.Content
		class="w-full !min-w-40 rounded-md border border-surface-50 bg-white p-1 shadow-lg"
		sideOffset={8}
	>
		{#each items ?? [] as item}
			<Select.Item
				value={item.value}
				label={item.label}
				class="data-[highlighted]:bg-primary-50 cursor-pointer data-[highlighted]:text-primary-500 px-4 py-2 rounded select-none flex gap-3 items-center justify-between"
			>
				<slot name="item" value={item.value}>
					<span class="font-semibold text-sm leading-4 py-1">{item.label}</span>
				</slot>
				<Select.ItemIndicator class="select-none">
					<i class="fa-solid fa-check"></i>
				</Select.ItemIndicator>
			</Select.Item>
		{/each}
		<Select.Arrow />
	</Select.Content>
</Select.Root>
