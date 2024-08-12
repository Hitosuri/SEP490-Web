<script lang="ts">
	import Breadcrumb from '$lib/components/common/Breadcrumb.svelte';
	import Container from '$lib/components/common/Container.svelte';
	import { Control, Field, Label } from 'formsnap';
	import type { PageData } from './$types';
	import DropdownSelect from '$lib/components/common/DropdownSelect.svelte';
	import {
		getModalStore,
		popup,
		type ModalSettings,
		type PopupSettings
	} from '@skeletonlabs/skeleton';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { Selected } from 'bits-ui';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { treatmentFilterSchema } from '$lib/form-schemas/treatment-filter-schema';
	import { z } from 'zod';
	import isEqual from 'lodash-es/isEqual';
	import endpoints from '$lib/endpoints';
	import { fly } from 'svelte/transition';
	import { formatCurrency } from '$lib/helpers/formatters';
	import DataTable from '$lib/components/common/DataTable.svelte';
	import CreateServiceForm from '$lib/components/services/CreateServiceForm.svelte';
	import TreatmentDetail from '$lib/components/services/TreatmentDetail.svelte';
	import EditServiceForm from '$lib/components/services/EditServiceForm.svelte';
	import { toast } from 'svelte-sonner';

	export let data: PageData;

	const modalStore = getModalStore();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const tableFields: TableField<Treatment>[] = [
		{
			displayName: 'Dịch vụ',
			name: 'name',
			sortable: true,
			align: 'left'
		},
		{
			displayName: 'Giá',
			name: 'price',
			sortable: true,
			align: 'right',
			formatter: formatCurrency,
			ellipsis: true
		}
	];
	const sortableField = tableFields.filter((x) => x?.sortable).map((x) => x!.name);
	const singleFilterTypes: Selected<keyof Treatment>[] = [
		{
			label: 'Tên dịch vụ',
			value: 'name'
		},
		{
			label: 'Khoảng giá',
			value: 'price'
		}
	];
	const form = superForm(data.treatmentFilterForm, {
		SPA: true,
		id: 'single',
		invalidateAll: false,
		resetForm: false,
		validators: zodClient(treatmentFilterSchema),
		onChange: ({ get, set, paths }) => {
			const path = paths[0];

			switch (path) {
				case 'fromPrice': {
					let fromValue = get('fromPrice');
					const toValue = get('toPrice');

					if (!fromValue || (typeof fromValue === 'number' && fromValue < 1)) {
						set('fromPrice', 1);
						fromValue = 1;
					}

					if (!toValue || (typeof toValue === 'number' && toValue < fromValue)) {
						set('toPrice', fromValue);
					}
					break;
				}
				case 'toPrice': {
					const toValue = get('toPrice');

					if (!toValue || (typeof toValue === 'number' && toValue < 1)) {
						set('toPrice', 1);
					}
				}
			}

			if (advancedFilterOpen) {
				return;
			}

			let inputData: Partial<z.infer<typeof treatmentFilterSchema>> = {};

			switch (path) {
				case 'name':
					inputData.name = get('name');
				case 'fromPrice':
				case 'toPrice':
					inputData[path as 'fromPrice' | 'toPrice'] = get(path) as number;
					break;
			}
			filtering(inputData, 1, pageSize, false, false, true);
		},
		onUpdate: ({ form }) => {
			const filteredSearchParams: Partial<z.infer<typeof treatmentFilterSchema>> = { ...form.data };
			Object.entries(filteredSearchParams).forEach((x) => {
				if (!x[1] || (typeof x[1] === 'number' && x[1] < 0)) {
					delete filteredSearchParams[x[0] as keyof typeof filteredSearchParams];
				}
			});
			filtering(filteredSearchParams, 1, pageSize, true, false, true);
		}
	});
	const { form: formData, enhance } = form;
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
	let invoices = data.treatmentListPage.data;
	let advancedFilterOpen = false;
	let selectedSingleFilterType = singleFilterTypes[0];
	let filterTimer: NodeJS.Timeout | undefined;
	let pageSize = data.treatmentListPage.pageSize || 10;
	let currentPage = data.treatmentListPage.pageNumber || 1;
	let totalItems = data.treatmentListPage.totalRecords || 0;
	let sortingField: keyof Treatment | undefined;
	let sortingAscending = false;
	let lastestFilterOption: Partial<z.infer<typeof treatmentFilterSchema>> = {};
	let lastestFilterOptionExtended: Record<string, string | number> = {};
	let loading = false;

	function filtering(
		filterOptions: Partial<z.infer<typeof treatmentFilterSchema>>,
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
					filterOptionsExtended.orderBy = sortingField;
					filterOptionsExtended.orderDesc = String(!sortingAscending);
				}

				if (!forceFilter && isEqual(lastestFilterOptionExtended, filterOptionsExtended)) {
					return;
				}

				const searchParams = new URLSearchParams();
				for (const [key, value] of Object.entries(filterOptionsExtended)) {
					searchParams.set(key, String(value));
				}
				const url = `${endpoints.treatments.get}?${searchParams}`;

				try {
					const response = await fetch(url, {
						headers: {
							Authorization: `Bearer ${$userStore.token}`
						}
					});

					if (response.ok) {
						const responseData: ApiResponse<Pagination<Treatment[]>> = await response.json();
						const pageData = responseData.body!;

						invoices = pageData.data;
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

	function advancedFilterClick() {
		advancedFilterOpen = !advancedFilterOpen;
		form.reset();
		resetPage();
	}

	function resetPage() {
		filtering({}, 1, pageSize, true, false, true);
	}

	function selectSorting(field: keyof Treatment | undefined) {
		if (field && !sortableField.includes(field)) {
			return;
		}

		if (sortingField !== field) {
			sortingField = field;
			sortingAscending = false;
		} else {
			sortingAscending = !sortingAscending;
		}

		filtering(lastestFilterOption, currentPage, pageSize, true);
	}

	function showCreateForm() {
		const modalSetting: ModalSettings = {
			type: 'component',
			component: {
				ref: CreateServiceForm,
				props: {
					createTreatmentForm: data.createTreatmentForm
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

	function showDetail(treatment: Treatment) {
		const modalSetting: ModalSettings = {
			type: 'component',
			component: {
				ref: TreatmentDetail,
				props: {
					treatment
				}
			}
		};

		modalStore.trigger(modalSetting);
	}

	function showEditForm(treatment: Treatment) {
		const modalSetting: ModalSettings = {
			type: 'component',
			component: {
				ref: EditServiceForm,
				props: {
					editTreatmentForm: data.createTreatmentForm,
					treatment
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

	function deleteTreatment(treatment: Treatment) {
		const modalSetting: ModalSettings = {
			type: 'confirm',
			title: 'Xác nhận',
			body: `Xác nhận xoá dịch vụ ${treatment.name}`,
			response: (r) => {
				if (!r || !$userStore) {
					return;
				}

				toast.promise(
					async (): Promise<string> => {
						const response = await fetch(endpoints.treatments.delete(treatment.id), {
							method: 'DELETE',
							headers: {
								'content-type': 'application/json',
								Authorization: `Bearer ${$userStore.token}`
							}
						});

						if (!response.ok) {
							const data = await response.json();
							if (typeof data?.error === 'string') {
								return Promise.reject(data?.error);
							} else if (Array.isArray(data?.error) || Array.isArray(data)) {
								const msg = (data?.error ?? data).join(', ');
								return Promise.reject(msg);
							}

							return Promise.reject();
						}
						filtering(lastestFilterOption, currentPage, pageSize, true, true);
						return `Đã xoá dịch vụ ${treatment.name}`;
					},
					{
						loading: 'Đang xử lý...',
						success: (msg) => msg ?? `Đã xoá dịch vụ ${treatment.name}`,
						error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình xoá dịch vụ'
					}
				);
			}
		};
		modalStore.trigger(modalSetting);
	}
</script>

<svelte:head>
	<title>Danh sách dịch vụ</title>
</svelte:head>
<Container heightFull heightScreenMin paddingTopHeader class="pt-4 flex flex-col">
	<Breadcrumb crumbs={[{ label: 'Danh sách dịch vụ' }]} highlight />
	<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Danh sách dịch vụ</h1>
	<div class="p-8 bg-slate-300 rounded-t-2xl space-y-6 flex-1">
		<div class="p-2 rounded-xl bg-white shadow-md group">
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
								<Field {form} name="name">
									<Control let:attrs>
										<input
											type="text"
											placeholder="Nhập tên dịch vụ..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto"
											{...attrs}
											bind:value={$formData.name}
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
				<button
					type="button"
					class="btn variant-filled-primary rounded-md font-medium"
					on:click={showCreateForm}
				>
					<i class="fa-solid fa-plus"></i>
					<span class="pl-1">Thêm</span>
				</button>
			</div>
			<div
				class="grid {advancedFilterOpen
					? 'grid-rows-[1fr]'
					: 'grid-rows-[0fr]'} transition-all duration-200 ease-out"
			>
				<div class="overflow-hidden">
					<form method="post" use:enhance class="p-6 pt-8">
						<div class="grid grid-cols-3 gap-x-8 gap-y-6 flex-wrap">
							<div>
								<Field {form} name="name">
									<Control let:attrs>
										<Label class="text-sm font-semibold text-surface-500 select-none">
											Tên dịch vụ
										</Label>
										<input
											type="text"
											placeholder="Nhập tên dịch vụ..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 mt-1"
											{...attrs}
											bind:value={$formData.name}
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
							<button
								type="submit"
								class="btn variant-filled-primary ml-auto mt-4 py-2 block h-fit self-end"
							>
								<i class="fa-solid fa-magnifying-glass"></i>
								<span>Tìm kiếm</span>
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
		<DataTable
			bind:items={invoices}
			bind:currentPage
			bind:pageSize
			bind:totalItems
			bind:sortingField
			bind:sortingAscending
			bind:loading
			fields={tableFields}
			detailEmitEvent
			on:pageChange={(e) => {
				currentPage = e.detail;
				filtering(lastestFilterOption, e.detail, pageSize, true);
			}}
			on:sortField={(e) => selectSorting(e.detail)}
			on:detail={(e) => showDetail(e.detail)}
			on:edit={(e) => showEditForm(e.detail)}
			on:delete={(e) => deleteTreatment(e.detail)}
		></DataTable>
	</div>
</Container>
