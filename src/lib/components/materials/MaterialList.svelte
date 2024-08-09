<script lang="ts">
	import DropdownSelect from '$lib/components/common/DropdownSelect.svelte';
	import { Dialog, type Selected } from 'bits-ui';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { materialFilterSchema } from '$lib/form-schemas/material-filter-schema';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import { fade, fly } from 'svelte/transition';
	import { Control, Field, Label } from 'formsnap';
	import { cubicOut } from 'svelte/easing';
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import {
		getModalStore,
		popup,
		type ModalSettings,
		type PopupSettings
	} from '@skeletonlabs/skeleton';
	import { formatCurrency } from '$lib/helpers/formatters';
	import DataTable from '$lib/components/common/DataTable.svelte';
	import isEqual from 'lodash-es/isEqual';
	import endpoints from '$lib/endpoints';
	import { uppercaseFirstLetter } from '$lib/helpers/utils';
	import CreateMaterialForm from '$lib/components/materials/CreateMaterialForm.svelte';
	import type { createMaterialSchema } from '$lib/form-schemas/create-material-schema';
	import ImportMaterialForm from './ImportMaterialForm.svelte';
	import { importMaterialSchema } from '$lib/form-schemas/import-material-schema';
	import EditMaterialForm from './EditMaterialForm.svelte';

	export let materialFilterForm: SuperValidated<z.infer<typeof materialFilterSchema>>;
	export let createMaterialForm: SuperValidated<z.infer<typeof createMaterialSchema>>;
	export let importMaterialForm: SuperValidated<z.infer<typeof importMaterialSchema>>;
	export let materialListPage: Pagination<Material[]>;

	const modalStore = getModalStore();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const priceFromPopupSetting: PopupSettings = {
		event: 'focus-blur',
		target: 'pricePopup-from',
		placement: 'top',
		middleware: {
			offset: 12
		}
	};
	const priceToPopupSetting: PopupSettings = {
		event: 'focus-blur',
		target: 'pricePopup-to',
		placement: 'top',
		middleware: {
			offset: 12
		}
	};
	const quantityFromPopupSetting: PopupSettings = {
		event: 'focus-blur',
		target: 'quantityPopup-from',
		placement: 'top',
		middleware: {
			offset: 12
		}
	};
	const quantityToPopupSetting: PopupSettings = {
		event: 'focus-blur',
		target: 'quantityPopup-to',
		placement: 'top',
		middleware: {
			offset: 12
		}
	};
	const form = superForm(materialFilterForm, {
		SPA: true,
		invalidateAll: false,
		resetForm: false,
		validators: zodClient(materialFilterSchema),
		onChange: ({ get, paths }) => {
			if (advancedFilterOpen) {
				return;
			}

			let inputData: Partial<z.infer<typeof materialFilterSchema>> = {};
			let ignoreDelay = false;

			switch (paths[0]) {
				case 'materialName':
				case 'supplierName':
					inputData[paths[0]] = get(paths[0]);
					break;
				case 'materialType':
					const typeId = get('materialType');
					if (typeId !== 0) {
						inputData.materialType = get('materialType');
					}
					ignoreDelay = true;
					break;
				case 'fromPrice':
				case 'toPrice':
					const fromPrice = get('fromPrice');
					const toPrice = get('toPrice');
					if (fromPrice > 0) {
						inputData.fromPrice = fromPrice;
					}
					if (toPrice > 0) {
						inputData.toPrice = toPrice;
					}
					break;
				case 'fromQuantity':
				case 'toQuantity':
					const fromQuantity = get('fromQuantity');
					const toQuantity = get('toQuantity');
					if (fromQuantity > 0) {
						inputData.fromQuantity = fromQuantity;
					}
					if (toQuantity > 0) {
						inputData.toQuantity = toQuantity;
					}
					break;
			}
			filtering(inputData, 1, pageSize, ignoreDelay, false, true);
		},
		onUpdate: ({ form }) => {
			const filteredSearchParams: Partial<z.infer<typeof materialFilterSchema>> = { ...form.data };
			Object.entries(filteredSearchParams).forEach((x) => {
				if (!x[1] || (typeof x[1] === 'number' && x[1] < 0)) {
					delete filteredSearchParams[x[0] as keyof typeof filteredSearchParams];
				}
			});
			filtering(filteredSearchParams, 1, pageSize, true, false, true);
		}
	});
	const { form: formData, enhance } = form;
	const tableFields: TableField<Material>[] = [
		{
			displayName: 'Tên vật tư',
			name: 'name',
			sortable: true,
			align: 'left'
		},
		{
			displayName: 'Giá',
			name: 'price',
			sortable: true,
			align: 'right',
			formatter: formatCurrency
		},
		{
			displayName: 'Tồn kho',
			name: 'quantity',
			sortable: true,
			align: 'right'
		},
		{
			displayName: 'Phân loại',
			name: 'materialTypeName',
			sortable: true,
			align: 'center'
		},
		{
			displayName: 'Nhà cung cấp',
			name: 'supplierName',
			sortable: true,
			align: 'left'
		}
	];
	const sortableField = tableFields.filter((x) => x?.sortable).map((x) => x!.name);
	const singleFilterTypes: Selected<keyof Material>[] = [
		{
			label: 'Tên vật tư',
			value: 'name'
		},
		{
			label: 'Giá',
			value: 'price'
		},
		{
			label: 'Tồn kho',
			value: 'quantity'
		},
		{
			label: 'Phân loại',
			value: 'materialTypeName'
		},
		{
			label: 'Nhà cung cấp',
			value: 'supplierName'
		}
	];
	let materialTypes: Selected<MaterialType>[] | undefined;
	let pageSize = materialListPage.pageSize || 10;
	let currentPage = materialListPage.pageNumber || 1;
	let totalItems = materialListPage.totalRecords || 0;
	let sortingField: keyof Material | undefined;
	let sortingAscending = false;
	let selectedSingleFilterType = singleFilterTypes[0];
	let advancedFilterOpen = false;
	let materials = materialListPage.data;
	let loading = false;
	let lastestFilterOption: Partial<z.infer<typeof materialFilterSchema>> = {};
	let lastestFilterOptionExtended: Record<string, string | number> = {};
	let filterTimer: NodeJS.Timeout;
	let createMatereialFormCloseBtn: HTMLButtonElement;

	onMount(async () => {
		if (!$userStore) {
			return;
		}

		const searchParams = new URLSearchParams();
		searchParams.set('page', '1');
		searchParams.set('size', '100');

		const r = await fetch(`${endpoints.materialTypes.get}?${searchParams}`, {
			headers: {
				Authorization: `Bearer ${$userStore.token}`,
				'content-type': 'application/json'
			}
		});

		if (r.ok) {
			const data: Pagination<MaterialType[]> = await r.json();
			materialTypes = [
				{
					label: 'Tất cả',
					value: {
						id: 0,
						name: 'Tất cả',
						code: ''
					}
				},
				...data.data.map((x) => ({
					label: x.name,
					value: x
				}))
			];
		}
	});

	function createMaterialFinish() {
		filtering(lastestFilterOption, currentPage, pageSize, true, true);
		createMatereialFormCloseBtn?.click();
	}

	function resetPage() {
		filtering({}, 1, pageSize, true, false, true);
	}

	function advancedFilterClick() {
		advancedFilterOpen = !advancedFilterOpen;
		form.reset();
		resetPage();
	}

	function selectSorting(field: keyof Material | undefined) {
		if (field && !sortableField.includes(field)) {
			return;
		}

		if (sortingField !== field) {
			sortingField = field;
			sortingAscending = false;
		} else {
			sortingAscending = !sortingAscending;
		}

		filtering(lastestFilterOption, currentPage, pageSize, true, true);
	}

	function filtering(
		filterOptions: Partial<z.infer<typeof materialFilterSchema>>,
		page: number,
		size: number,
		ignoreDelay: boolean = false,
		forceFilter: boolean = false,
		resetCurrentPage: boolean = false
	) {
		if (filterTimer) {
			clearTimeout(filterTimer);
		}

		filterTimer = setTimeout(
			async () => {
				if (!$userStore) {
					return;
				}

				const filterOptionsExtended: Record<string, string | number> = {
					...filterOptions,
					page: String(page),
					size: String(size)
				};

				if (sortingField) {
					filterOptionsExtended.orderBy = uppercaseFirstLetter(sortingField);
					filterOptionsExtended.orderDesc = String(!sortingAscending);
				}

				if (!forceFilter && isEqual(lastestFilterOptionExtended, filterOptionsExtended)) {
					return;
				}

				const searchParams = new URLSearchParams();
				for (const [key, value] of Object.entries(filterOptionsExtended)) {
					searchParams.set(key, String(value));
				}
				const url = `${endpoints.materials.get}?${searchParams}`;

				try {
					const response = await fetch(url, {
						headers: {
							Authorization: `Bearer ${$userStore.token}`
						}
					});

					if (response.ok) {
						const pageData: Pagination<Material[]> = await response.json();

						materials = pageData.data;
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

	function importMaterial(material: Material) {
		const modalSetting: ModalSettings = {
			type: 'component',
			component: {
				ref: ImportMaterialForm,
				props: {
					importMaterialForm,
					material
				}
			},
			response: (r) => {
				if (r) {
					filtering(lastestFilterOption, currentPage, pageSize, true, true);
				}
			}
		};

		modalStore.trigger(modalSetting);
	}

	function editMaterial(material: Material) {
		// const selectdMaterialType = materialTypes?.find((x) => x.value.id === material.materialTypeId);
		const modalSetting: ModalSettings = {
			type: 'component',
			component: {
				ref: EditMaterialForm,
				props: {
					editMaterialForm: importMaterialForm,
					materialTypes,
					material
				}
			},
			response: (r) => {
				if (r) {
					filtering(lastestFilterOption, currentPage, pageSize, true, true);
				}
			}
		};

		modalStore.trigger(modalSetting);
	}
</script>

<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Danh sách vật tư</h1>
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
				{#if selectedSingleFilterType.value === 'name'}
					<Field {form} name="materialName">
						<Control let:attrs>
							<input
								type="text"
								placeholder="Nhập tên vật tư..."
								class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto"
								{...attrs}
								bind:value={$formData.materialName}
							/>
						</Control>
					</Field>
				{:else if selectedSingleFilterType.value === 'price'}
					{#each ['from', 'to'] as t}
						<div
							class="rounded-md shadow-md border border-surface-100 bg-white px-4 py-2 select-none {$formData.fromPrice >
								0 || $formData.toPrice > 0
								? ''
								: '!hidden'}"
							data-popup="pricePopup-{t}"
						>
							<p>
								{#if $formData.fromPrice > 0 && $formData.toPrice <= 0}
									Giá lớn hơn hoặc bằng
									<span class="font-semibold">{formatCurrency($formData.fromPrice)}</span>
								{:else if $formData.fromPrice <= 0 && $formData.toPrice > 0}
									Giá nhỏ hơn hoặc bằng
									<span class="font-semibold">{formatCurrency($formData.toPrice)}</span>
								{:else if $formData.fromPrice > 0 && $formData.toPrice > 0}
									Giá trong khoảng từ
									<span class="font-semibold">{formatCurrency($formData.fromPrice)}</span>
									tới
									<span class="font-semibold">{formatCurrency($formData.toPrice)}</span>
								{/if}
							</p>
							<div class="arrow border-r border-b border-surface-100 bg-white" />
						</div>
					{/each}
					<div class="flex input-group rounded-md w-64">
						<Field {form} name="fromPrice">
							<Control let:attrs>
								<input
									use:popup={priceFromPopupSetting}
									type="number"
									class="flex-1 min-w-0 text-center !bg-white/70 !focus-within:bg-white/100"
									placeholder="Từ..."
									{...attrs}
									bind:value={$formData.fromPrice}
								/>
							</Control>
						</Field>
						<div class="input-group-shim bg-slate-200">
							<i class="fa-regular fa-dash"></i>
						</div>
						<Field {form} name="toPrice">
							<Control let:attrs>
								<input
									use:popup={priceToPopupSetting}
									type="number"
									class="flex-1 min-w-0 text-center !bg-white/70 !focus-within:bg-white/100"
									placeholder="Đến..."
									{...attrs}
									bind:value={$formData.toPrice}
								/>
							</Control>
						</Field>
					</div>
				{:else if selectedSingleFilterType.value === 'quantity'}
					{#each ['from', 'to'] as t}
						<div
							class="rounded-md shadow-md border border-surface-100 bg-white px-4 py-2 select-none {$formData.fromQuantity >
								0 || $formData.toQuantity > 0
								? ''
								: '!hidden'}"
							data-popup="quantityPopup-{t}"
						>
							<p>
								{#if $formData.fromQuantity > 0 && $formData.toQuantity <= 0}
									Tồn kho lớn hơn hoặc bằng
									<span class="font-semibold">{$formData.fromQuantity}</span>
								{:else if $formData.fromQuantity <= 0 && $formData.toQuantity > 0}
									Tồn kho nhỏ hơn hoặc bằng
									<span class="font-semibold">{$formData.toQuantity}</span>
								{:else if $formData.fromQuantity > 0 && $formData.toQuantity > 0}
									Tồn kho trong khoảng từ
									<span class="font-semibold">{$formData.fromQuantity}</span>
									tới
									<span class="font-semibold">{$formData.toQuantity}</span>
								{/if}
							</p>
							<div class="arrow border-r border-b border-surface-100 bg-white" />
						</div>
					{/each}
					<div class="flex input-group rounded-md w-64">
						<Field {form} name="fromQuantity">
							<Control let:attrs>
								<input
									use:popup={quantityFromPopupSetting}
									type="number"
									class="flex-1 min-w-0 text-center !bg-white/70 !focus-within:bg-white/100"
									placeholder="Từ..."
									{...attrs}
									bind:value={$formData.fromQuantity}
								/>
							</Control>
						</Field>
						<div class="input-group-shim bg-slate-200">
							<i class="fa-regular fa-dash"></i>
						</div>
						<Field {form} name="toQuantity">
							<Control let:attrs>
								<input
									use:popup={quantityToPopupSetting}
									type="number"
									class="flex-1 min-w-0 text-center !bg-white/70 !focus-within:bg-white/100"
									placeholder="Đến..."
									{...attrs}
									bind:value={$formData.toQuantity}
								/>
							</Control>
						</Field>
					</div>
				{:else if selectedSingleFilterType.value === 'materialTypeName'}
					{#if materialTypes}
						<DropdownSelect
							items={materialTypes}
							selected={materialTypes[0]}
							onSelectedChange={(mt) => ($formData.materialType = mt?.value.id ?? 0)}
							let:ValueComponent
						>
							<ValueComponent class="font-semibold px-2" />
							<div class="flex flex-col text-[0.55rem] pl-1 text-surface-400">
								<i class="fa-solid fa-chevron-up"></i>
								<i class="fa-solid fa-chevron-down"></i>
							</div>
							<svelte:fragment slot="item" let:value>
								<div>
									<p class="font-medium">{value.name}</p>
									<p class="text-xs font-medium text-surface-400">{value.code}</p>
								</div>
							</svelte:fragment>
						</DropdownSelect>
					{/if}
				{:else if selectedSingleFilterType.value === 'supplierName'}
					<Field {form} name="supplierName">
						<Control let:attrs>
							<input
								type="text"
								placeholder="Nhập tên nhà cung cấp..."
								class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto"
								{...attrs}
								bind:value={$formData.supplierName}
							/>
						</Control>
					</Field>
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
	<Dialog.Root>
		<Dialog.Trigger class="btn variant-filled-primary rounded-md font-medium">
			<i class="fa-solid fa-plus"></i>
			<span class="pl-1">Thêm</span>
		</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay
				transition={fade}
				transitionConfig={{
					duration: 200,
					easing: cubicOut
				}}
				class="fixed inset-0 z-50 bg-black/80"
			/>
			<Dialog.Content
				transition={fly}
				transitionConfig={{
					duration: 200,
					y: 100,
					easing: cubicOut
				}}
				class="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full sm:w-5/6 md:w-3/4 lg:w-3/5 xl:w-1/2 2xl:w-[720px] p-4"
			>
				{#if materialTypes}
					<CreateMaterialForm {createMaterialForm} {materialTypes} on:finish={createMaterialFinish}>
						<svelte:fragment slot="closeBtn">
							<Dialog.Close asChild let:builder>
								<button
									use:builder.action
									{...builder}
									bind:this={createMatereialFormCloseBtn}
									class="btn-icon text-2xl !outline-none text-black/60 hover:text-black transition-colors"
								>
									<i class="fa-solid fa-xmark"></i>
								</button>
							</Dialog.Close>
						</svelte:fragment>
						<svelte:fragment slot="cancelBtn">
							<Dialog.Close class="variant-soft-surface">
								<i class="fa-solid fa-delete-left"></i>
								<span class="pl-1">Huỷ</span>
							</Dialog.Close>
						</svelte:fragment>
					</CreateMaterialForm>
				{/if}
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
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
					<Field {form} name="materialName">
						<Control let:attrs>
							<Label class="text-sm font-semibold text-surface-500 select-none">Tên vật tư</Label>
							<input
								type="text"
								placeholder="Nhập tên vật tư..."
								class="input rounded-md bg-white/70 focus-within:bg-white/100 mt-1"
								{...attrs}
								bind:value={$formData.materialName}
							/>
						</Control>
					</Field>
				</div>
				<div>
					{#each ['from', 'to'] as t}
						<div
							class="rounded-md shadow-md border border-surface-100 bg-white px-4 py-2 select-none {$formData.fromPrice >
								0 || $formData.toPrice > 0
								? ''
								: '!hidden'}"
							data-popup="pricePopup-{t}"
						>
							<p>
								{#if $formData.fromPrice > 0 && $formData.toPrice <= 0}
									Giá lớn hơn hoặc bằng
									<span class="font-semibold">{formatCurrency($formData.fromPrice)}</span>
								{:else if $formData.fromPrice <= 0 && $formData.toPrice > 0}
									Giá nhỏ hơn hoặc bằng
									<span class="font-semibold">{formatCurrency($formData.toPrice)}</span>
								{:else if $formData.fromPrice > 0 && $formData.toPrice > 0}
									Giá trong khoảng từ
									<span class="font-semibold">{formatCurrency($formData.fromPrice)}</span>
									tới
									<span class="font-semibold">{formatCurrency($formData.toPrice)}</span>
								{/if}
							</p>
							<div class="arrow border-r border-b border-surface-100 bg-white" />
						</div>
					{/each}
					<p class="text-sm font-semibold text-surface-500 select-none">Giá</p>
					<div class="flex input-group border-surface-500/25 rounded-md w-full mt-1">
						<Field {form} name="fromPrice">
							<Control let:attrs>
								<input
									use:popup={priceFromPopupSetting}
									type="number"
									class="flex-1 min-w-0 text-center !bg-white"
									placeholder="Từ..."
									{...attrs}
									bind:value={$formData.fromPrice}
								/>
							</Control>
						</Field>
						<div class="input-group-shim bg-slate-200">
							<i class="fa-regular fa-dash"></i>
						</div>
						<Field {form} name="toPrice">
							<Control let:attrs>
								<input
									use:popup={priceToPopupSetting}
									type="number"
									class="flex-1 min-w-0 text-center !bg-white"
									placeholder="Đến..."
									{...attrs}
									bind:value={$formData.toPrice}
								/>
							</Control>
						</Field>
					</div>
				</div>
				<div>
					{#each ['from', 'to'] as t}
						<div
							class="rounded-md shadow-md border border-surface-100 bg-white px-4 py-2 select-none {$formData.fromQuantity >
								0 || $formData.toQuantity > 0
								? ''
								: '!hidden'}"
							data-popup="quantityPopup-{t}"
						>
							<p>
								{#if $formData.fromQuantity > 0 && $formData.toQuantity <= 0}
									Tồn kho lớn hơn hoặc bằng
									<span class="font-semibold">{$formData.fromQuantity}</span>
								{:else if $formData.fromQuantity <= 0 && $formData.toQuantity > 0}
									Tồn kho nhỏ hơn hoặc bằng
									<span class="font-semibold">{$formData.toQuantity}</span>
								{:else if $formData.fromQuantity > 0 && $formData.toQuantity > 0}
									Tồn kho trong khoảng từ
									<span class="font-semibold">{$formData.fromQuantity}</span>
									tới
									<span class="font-semibold">{$formData.toQuantity}</span>
								{/if}
							</p>
							<div class="arrow border-r border-b border-surface-100 bg-white" />
						</div>
					{/each}
					<p class="text-sm font-semibold text-surface-500 select-none">Tồn kho</p>
					<div class="flex input-group border-surface-500/25 rounded-md w-full mt-1">
						<Field {form} name="fromQuantity">
							<Control let:attrs>
								<input
									use:popup={quantityFromPopupSetting}
									type="number"
									class="flex-1 min-w-0 text-center !bg-white"
									placeholder="Từ..."
									{...attrs}
									bind:value={$formData.fromQuantity}
								/>
							</Control>
						</Field>
						<div class="input-group-shim bg-slate-200">
							<i class="fa-regular fa-dash"></i>
						</div>
						<Field {form} name="toQuantity">
							<Control let:attrs>
								<input
									use:popup={quantityToPopupSetting}
									type="number"
									class="flex-1 min-w-0 text-center !bg-white"
									placeholder="Đến..."
									{...attrs}
									bind:value={$formData.toQuantity}
								/>
							</Control>
						</Field>
					</div>
				</div>
				<div>
					<p class="text-sm font-semibold text-surface-500 select-none">Phân loại</p>
					{#if materialTypes}
						<DropdownSelect
							items={materialTypes}
							selected={materialTypes[0]}
							onSelectedChange={(mt) => ($formData.materialType = mt?.value.id ?? 0)}
							regionInput="input-group flex flex-row justify-between mt-1 w-full border-surface-500/40 py-2"
							let:ValueComponent
						>
							<ValueComponent class="font-semibold px-2" />
							<div class="flex flex-col text-[0.55rem] pl-1">
								<i class="fa-solid fa-chevron-up"></i>
								<i class="fa-solid fa-chevron-down"></i>
							</div>
							<svelte:fragment slot="item" let:value>
								<div>
									<p class="font-medium">{value.name}</p>
									<p class="text-xs font-medium text-surface-400">{value.code}</p>
								</div>
							</svelte:fragment>
						</DropdownSelect>
					{/if}
				</div>
				<div>
					<Field {form} name="supplierName">
						<Control let:attrs>
							<Label class="text-sm font-semibold text-surface-500 select-none">Nhà cung cấp</Label>
							<input
								type="text"
								placeholder="Nhập tên nhà cung cấp..."
								class="input rounded-md bg-white/70 focus-within:bg-white/100 mt-1"
								{...attrs}
								bind:value={$formData.supplierName}
							/>
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
	bind:items={materials}
	bind:currentPage
	bind:pageSize
	bind:totalItems
	bind:sortingField
	bind:sortingAscending
	bind:loading
	shadow={false}
	showDelete={false}
	fields={tableFields}
	actionMenu={[
		{
			icon: 'fa-regular fa-file-import',
			label: 'Nhập vật tư',
			click: importMaterial
		}
	]}
	on:pageChange={(e) => {
		currentPage = e.detail;
		filtering(lastestFilterOption, e.detail, pageSize, true);
	}}
	on:sortField={(e) => selectSorting(e.detail)}
	on:edit={(e) => editMaterial(e.detail)}
></DataTable>
