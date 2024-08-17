<script lang="ts">
	import DropdownSelect from '$lib/components/common/DropdownSelect.svelte';
	import { type Selected } from 'bits-ui';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import { fly } from 'svelte/transition';
	import { Control, Field, Label } from 'formsnap';
	import { getContext, type ComponentEvents } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { formatCompactDate, formatCurrency } from '$lib/helpers/formatters';
	import DataTable from '$lib/components/common/DataTable.svelte';
	import isEqual from 'lodash-es/isEqual';
	import endpoints from '$lib/endpoints';
	import { importMaterialFilterSchema } from '$lib/form-schemas/import-material-filter-schema';
	import DateRangePicker from '../common/DateRangePicker.svelte';
	import NumberInput from '../common/NumberInput.svelte';

	export let importMaterialFilterForm: SuperValidated<z.infer<typeof importMaterialFilterSchema>>;
	export function onTabActive() {
		if (importMaterials.length > 0) {
			return;
		}

		filtering({}, currentPage, pageSize, true, true, true);
	}

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const form = superForm(importMaterialFilterForm, {
		SPA: true,
		invalidateAll: false,
		resetForm: false,
		validators: zodClient(importMaterialFilterSchema),
		onChange: ({ get, set, paths }) => {
			if (paths[0] === 'quantity') {
				const quantity = get('quantity');
				if (!quantity || quantity < 0) {
					set('quantity', 0);
				}
			}

			if (advancedFilterOpen) {
				return;
			}

			let inputData: Partial<z.infer<typeof importMaterialFilterSchema>> = {};
			let ignoreDelay = false;

			switch (paths[0]) {
				case 'importBy':
				case 'importMaterialName':
					inputData[paths[0]] = get(paths[0]);
					break;
				case 'quantity':
					inputData['quantity'] = get('quantity');
					break;
				case 'fromDate':
				case 'toDate':
					const fromDate = get('fromDate');
					const toDate = get('toDate');
					if (fromDate) {
						inputData.fromDate = fromDate;
					}
					if (toDate) {
						inputData.toDate = toDate;
					}
					break;
			}
			filtering(inputData, 1, pageSize, ignoreDelay, false, true);
		},
		onUpdate: ({ form }) => {
			const filteredSearchParams: Partial<z.infer<typeof importMaterialFilterSchema>> = {
				...form.data
			};
			Object.entries(filteredSearchParams).forEach((x) => {
				if (!x[1] || (typeof x[1] === 'number' && x[1] < 0)) {
					delete filteredSearchParams[x[0] as keyof typeof filteredSearchParams];
				}
			});
			filtering(filteredSearchParams, 1, pageSize, true, false, true);
		}
	});
	const { form: formData, enhance } = form;
	const tableFields: TableField<ImportMaterial>[] = [
		{
			displayName: 'Tên vật tư',
			name: 'materialName',
			align: 'left'
		},
		{
			displayName: 'Ngày nhập',
			name: 'importDate',
			align: 'center',
			formatter: formatCompactDate
		},
		{
			displayName: 'Hạn sử dụng',
			name: 'expiryDate',
			align: 'center',
			formatter: formatCompactDate
		},
		{
			displayName: 'Người nhập',
			name: 'importedBy',
			align: 'left'
		},
		{
			displayName: 'Số lượng',
			name: 'quantity',
			align: 'right'
		},
		{
			displayName: 'Giá nhập',
			name: 'inputPrice',
			align: 'right',
			formatter: formatCurrency
		}
	];
	const singleFilterTypes: Selected<keyof ImportMaterial>[] = [
		{
			label: 'Tên vật tư',
			value: 'materialName'
		},
		{
			label: 'Người nhập',
			value: 'importedBy'
		},
		{
			label: 'Số lượng',
			value: 'quantity'
		},
		{
			label: 'Ngày nhập',
			value: 'importDate'
		}
	];
	let pageSize = 10;
	let currentPage = 1;
	let totalItems = 0;
	let selectedSingleFilterType = singleFilterTypes[0];
	let advancedFilterOpen = false;
	let importMaterials: ImportMaterial[] = [];
	let loading = false;
	let lastestFilterOption: Partial<z.infer<typeof importMaterialFilterSchema>> = {};
	let lastestFilterOptionExtended: Record<string, string | number | Date> = {};
	let filterTimer: NodeJS.Timeout;
	let refreshTrigger = Math.random();

	function resetPage() {
		filtering({}, 1, pageSize, true, false, true);
		refreshTrigger = Math.random();
	}

	function advancedFilterClick() {
		advancedFilterOpen = !advancedFilterOpen;
		form.reset();
		resetPage();
	}

	function filtering(
		filterOptions: Partial<z.infer<typeof importMaterialFilterSchema>>,
		page: number,
		size: number,
		ignoreDelay: boolean = false,
		forceFilter: boolean = false,
		resetCurrentPage: boolean = false
	) {
		const filterOptionsExtended: Record<string, string | number | Date> = {
			...filterOptions,
			page: String(page),
			size: String(size)
		};

		if (!forceFilter && isEqual(lastestFilterOptionExtended, filterOptionsExtended)) {
			return;
		}

		if (filterTimer) {
			clearTimeout(filterTimer);
		}

		filterTimer = setTimeout(
			async () => {
				if (!$userStore) {
					return;
				}

				const searchParams = new URLSearchParams();
				for (const [key, value] of Object.entries(filterOptionsExtended)) {
					if (!value || (typeof value === 'number' && value < 0)) {
						continue;
					}
					searchParams.set(key, value instanceof Date ? value.toISOString() : String(value));
				}
				const url = `${endpoints.materials.import.get}?${searchParams}`;

				try {
					const response = await fetch(url, {
						headers: {
							Authorization: `Bearer ${$userStore.token}`
						}
					});

					if (response.ok) {
						const pageData: Pagination<ImportMaterial[]> = await response.json();

						pageData.data.forEach((x) => {
							x.importDate = new Date(x.importDate);
							x.expiryDate = new Date(x.expiryDate);
						});
						importMaterials = pageData.data;
						totalItems = pageData.totalRecords;
						lastestFilterOption = filterOptions;
						lastestFilterOptionExtended = filterOptionsExtended;

						if (resetCurrentPage) {
							currentPage = 1;
						}
					}
				} catch (error) {
					console.log(error);
				}
			},
			ignoreDelay ? 0 : 400
		);
	}

	function onImportDateChange(e: ComponentEvents<DateRangePicker>['valueChange']) {
		if (!e.detail) {
			$formData.fromDate = undefined;
			$formData.toDate = undefined;
		} else {
			$formData.fromDate = e.detail[0];
			$formData.toDate = e.detail[0];
		}
	}
</script>

<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Lịch sử nhập vật tư</h1>
<div class="p-1 bg-slate-300 shadow-inner flex gap-1 rounded-lg overflow-hidden">
	<DropdownSelect
		items={singleFilterTypes}
		disabled={advancedFilterOpen}
		bind:selected={selectedSingleFilterType}
		onSelectedChange={() => {
			form.reset();
			resetPage();
		}}
		let:ValueComponent
	>
		<i class="fa-regular fa-filter text-surface-300"></i>
		<span class="pl-1">Tìm theo:</span>
		<ValueComponent class="font-semibold" />
		<div class="flex flex-col text-[0.55rem] pl-1 text-surface-400">
			<i class="fa-solid fa-chevron-up"></i>
			<i class="fa-solid fa-chevron-down"></i>
		</div>
	</DropdownSelect>
	{#if !advancedFilterOpen}
		<form method="post" use:enhance transition:fly={{ x: 30, duration: 200 }}>
			<fieldset class="flex gap-1 items-center" disabled={advancedFilterOpen}>
				{#if selectedSingleFilterType.value === 'materialName'}
					<Field {form} name="importMaterialName">
						<Control let:attrs>
							<input
								type="text"
								placeholder="Nhập tên vật tư..."
								class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto"
								{...attrs}
								bind:value={$formData.importMaterialName}
							/>
						</Control>
					</Field>
				{:else if selectedSingleFilterType.value === 'importedBy'}
					<Field {form} name="importBy">
						<Control let:attrs>
							<input
								type="text"
								placeholder="Nhập tên người nhập..."
								class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto"
								{...attrs}
								bind:value={$formData.importBy}
							/>
						</Control>
					</Field>
				{:else if selectedSingleFilterType.value === 'quantity'}
					<div class="w-44">
						<NumberInput bind:value={$formData.quantity} />
					</div>
				{:else if selectedSingleFilterType.value === 'importDate'}
					{#key refreshTrigger}
						<DateRangePicker regionInput="!bg-white" on:valueChange={onImportDateChange} />
					{/key}
				{/if}
			</fieldset>
		</form>
	{/if}
	<button
		on:click={advancedFilterClick}
		class="btn {advancedFilterOpen
			? 'variant-filled-tertiary'
			: 'bg-white text-tertiary-600'} rounded-md font-medium ml-auto"
	>
		<i class="fa-regular fa-sliders"></i>
		<span class="pl-2">Tìm kiếm kết hợp</span>
	</button>
</div>
<div
	class="grid transition-all duration-200 ease-out {advancedFilterOpen
		? 'grid-rows-[1fr]'
		: 'grid-rows-[0fr]'}"
>
	<div class="overflow-hidden">
		<form method="post" use:enhance class="p-6 pt-8">
			<div class="grid grid-cols-3 gap-x-8 gap-y-6 flex-wrap">
				<div>
					<Field {form} name="importMaterialName">
						<Control let:attrs>
							<Label class="text-sm font-semibold text-surface-500 select-none">Tên vật tư</Label>
							<input
								type="text"
								placeholder="Nhập tên vật tư..."
								class="input rounded-container-token bg-white/70 focus-within:bg-white/100 mt-1"
								{...attrs}
								bind:value={$formData.importMaterialName}
							/>
						</Control>
					</Field>
				</div>
				<div>
					<Field {form} name="importBy">
						<Control let:attrs>
							<Label class="text-sm font-semibold text-surface-500 select-none">
								Tên người nhập
							</Label>
							<input
								type="text"
								placeholder="Nhập tên người nhập..."
								class="input rounded-container-token bg-white/70 focus-within:bg-white/100 mt-1"
								{...attrs}
								bind:value={$formData.importBy}
							/>
						</Control>
					</Field>
				</div>
				<div>
					<Field {form} name="quantity">
						<Control let:attrs>
							<Label class="text-sm font-semibold text-surface-500 select-none mb-1">
								Số lượng
							</Label>
							<NumberInput bind:value={$formData.quantity} />
						</Control>
					</Field>
				</div>
				<div class="col-span-3">
					<Field {form} name="quantity">
						<Control let:attrs>
							<Label class="text-sm font-semibold text-surface-500 select-none mb-1">
								Ngày nhập
							</Label>
							<div class="w-fit">
								{#key refreshTrigger}
									<DateRangePicker on:valueChange={onImportDateChange} />
								{/key}
							</div>
						</Control>
					</Field>
				</div>
			</div>
			<button type="submit" class="btn variant-filled-primary ml-auto mt-4 block">
				<i class="fa-solid fa-magnifying-glass"></i>
				<span>Tìm kiếm</span>
			</button>
		</form>
	</div>
</div>
<div class="border-b pt-4 mb-4"></div>
<DataTable
	bind:items={importMaterials}
	bind:currentPage
	bind:pageSize
	bind:totalItems
	bind:loading
	shadow={false}
	showDelete={false}
	showEdit={false}
	fields={tableFields}
	on:pageChange={(e) => {
		currentPage = e.detail;
		filtering(lastestFilterOption, e.detail, pageSize, true);
	}}
	on:sortField={() => {
		form.reset();
		resetPage();
	}}
></DataTable>
