<script lang="ts">
	import type { Selected } from 'bits-ui';
	import SearchCombobox from '$lib/components/common/SearchCombobox.svelte';
	import type { Readable, Writable } from 'svelte/store';
	import { createEventDispatcher, getContext } from 'svelte';
	import endpoints from '$lib/endpoints';
	import NumberInput from '$lib/components/common/NumberInput.svelte';
	import { autoHeightTextArea } from '$lib/actions/auto-height-textarea';

	export let index: number = 0;
	export let selectedMaterialId: number;
	export let quantity: number;
	export let note: string;
	export let excludeIds: number[] = [];

	const dispatch = createEventDispatcher<{ remove: undefined }>();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	let errors = getContext<Readable<Record<string | number, string[]>>>('material-errors');
	let selectedMaterial: Selected<Material> | undefined;

	$: selectedMaterialId = selectedMaterial?.value.id ?? 0;
	$: errorList = $errors[index] ?? [];

	async function searchMaterialsFn(keyword: string): Promise<Selected<Material>[] | undefined> {
		if (!$userStore) {
			return;
		}

		const searchParams = new URLSearchParams();
		searchParams.set('page', '1');
		searchParams.set('size', '5');
		searchParams.set('materialName', keyword);

		excludeIds.forEach((x) => {
			if (x) {
				searchParams.append('excludeIds', String(x));
			}
		});

		const url = `${endpoints.materials.get}?${searchParams}`;
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${$userStore.token}`
			}
		});

		if (!response.ok) {
			return;
		}

		const data: Pagination<Material[]> = await response.json();

		return data.data.map((x) => ({
			label: x.name ?? '',
			value: x
		}));
	}
</script>

<tr class={errorList.length === 0 ? 'border-b' : ''}>
	<td class="py-2 text-center leading-[42px] text-success-500 min-w-[33px] align-top"
		>{index + 1}</td
	>
	<td class="px-2 py-2 align-top">
		<SearchCombobox
			bind:selected={selectedMaterial}
			searchFn={searchMaterialsFn}
			placeholder="Tên vật tư..."
			clearable
		/>
	</td>
	<td class="px-2 py-2 align-top">
		<NumberInput bind:value={quantity} />
	</td>
	<td class="px-2 py-2 align-top">
		<textarea
			maxlength={255}
			class="textarea rounded-md bg-white"
			placeholder="Nhập ghi chú..."
			bind:value={note}
			use:autoHeightTextArea={{
				value: note,
				minRows: 1
			}}
		></textarea>
	</td>
	<td class="align-top py-2">
		<div class="flex mx-auto h-[42px] items-center">
			<button
				type="button"
				class="btn-icon btn-icon-sm rounded-container-token variant-soft-error block"
				on:click={() => dispatch('remove')}
			>
				<i class="fa-solid fa-xmark"></i>
			</button>
		</div>
	</td>
</tr>
{#if errorList.length > 0}
	<tr class="border-b">
		<td></td>
		<td colspan="4" data-fs-field-errors class="px-2 pb-2">
			{#each errorList as error}
				<p data-fs-field-error data-fs-error>- {error}</p>
			{/each}
		</td>
	</tr>
{/if}
