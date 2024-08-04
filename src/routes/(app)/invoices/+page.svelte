<script lang="ts">
	import Breadcrumb from '$lib/components/common/Breadcrumb.svelte';
	import Container from '$lib/components/common/Container.svelte';
	import type { Selected } from 'bits-ui';
	import type { PageData } from './$types';
	import DropdownSelect from '$lib/components/common/DropdownSelect.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { invoiceFilterSchema } from '$lib/form-schemas/invoice-filter-schema';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { z } from 'zod';
	import endpoints from '$lib/endpoints';
	import isEqual from 'lodash-es/isEqual';
	import { fly } from 'svelte/transition';
	import { Control, Field, Label } from 'formsnap';
	import DataTable from '$lib/components/common/DataTable.svelte';
	import { formatCompactDate, formatCompactDateTime } from '$lib/helpers/formatters';
	import { RecordStatus } from '$lib/constants/record-constant';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import InvoiceDetail from '$lib/components/invoices/InvoiceDetail.svelte';

	export let data: PageData;

	const modalStore = getModalStore();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const tableFields: TableField<Payment>[] = [
		{
			displayName: 'Bệnh nhân',
			name: 'patientName',
			sortable: true,
			align: 'left'
		},
		{
			displayName: 'Số điện thoại',
			name: 'phone',
			sortable: true,
			align: 'left'
		},
		{
			displayName: 'Bác sĩ',
			name: 'doctorName',
			sortable: true,
			align: 'left'
		},
		{
			displayName: 'Thời gian khám',
			name: 'examinationDate',
			sortable: true,
			align: 'center',
			formatter: formatCompactDateTime
		},
		{
			displayName: 'Trạng thái',
			name: 'status',
			sortable: true
		}
	];
	const sortableField = tableFields.filter((x) => x?.sortable).map((x) => x!.name);
	const singleFilterTypes: Selected<keyof Payment>[] = [
		{
			label: 'Tên bệnh nhân',
			value: 'patientName'
		},
		{
			label: 'Số điện thoại',
			value: 'phone'
		},
		{
			label: 'Email',
			value: 'email'
		},
		{
			label: 'Tên bác sĩ',
			value: 'doctorName'
		}
	];
	const form = superForm(data.invoiceFilterForm, {
		SPA: true,
		id: 'single',
		invalidateAll: false,
		resetForm: false,
		validators: zodClient(invoiceFilterSchema),
		onChange: ({ get, paths }) => {
			if (advancedFilterOpen) {
				return;
			}

			let inputData: Partial<z.infer<typeof invoiceFilterSchema>> = {};

			switch (paths[0]) {
				case 'patientName':
				case 'phoneNumber':
				case 'email':
				case 'doctorName':
					const value = get(paths[0]);
					if (!value.trim()) {
						break;
					}
					inputData[paths[0]] = value;
					break;
			}
			filtering(inputData, 1, pageSize, false, false, true);
		},
		onUpdate: ({ form }) => {
			const filteredSearchParams: Partial<z.infer<typeof invoiceFilterSchema>> = { ...form.data };
			Object.entries(filteredSearchParams).forEach((x) => {
				if (!x[1].trim()) {
					delete filteredSearchParams[x[0] as keyof typeof filteredSearchParams];
				}
			});
			filtering(filteredSearchParams, 1, pageSize, true, false, true);
		}
	});
	const { form: formData, enhance } = form;
	let invoices = data.invoiceListPage.data;
	let advancedFilterOpen = false;
	let selectedSingleFilterType = singleFilterTypes[0];
	let filterTimer: NodeJS.Timeout | undefined;
	let pageSize = data.invoiceListPage.pageSize || 10;
	let currentPage = data.invoiceListPage.pageNumber || 1;
	let totalItems = data.invoiceListPage.totalRecords || 0;
	let sortingField: keyof Payment | undefined;
	let sortingAscending = false;
	let lastestFilterOption: Partial<z.infer<typeof invoiceFilterSchema>> = {};
	let lastestFilterOptionExtended: Record<string, string | number> = {};
	let loading = false;

	function filtering(
		filterOptions: Partial<z.infer<typeof invoiceFilterSchema>>,
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
				const url = `${endpoints.payment.get}?${searchParams}`;

				try {
					const response = await fetch(url, {
						headers: {
							Authorization: `Bearer ${$userStore.token}`
						}
					});

					if (response.ok) {
						const pageData: Pagination<Payment[]> = await response.json();

						pageData.data.forEach((x) => {
							x.examinationDate = new Date(x.examinationDate);
						});

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

	function selectSorting(field: keyof Payment | undefined) {
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

	function showDetail(id: number) {
		const modalSetting: ModalSettings = {
			type: 'component',
			component: {
				ref: InvoiceDetail,
				props: {
					recordId: id
				}
			}
		};
		modalStore.trigger(modalSetting);
	}
</script>

<svelte:head>
	<title>Danh sách hoá đơn</title>
</svelte:head>
<Container heightFull heightScreenMin paddingTopHeader class="pt-4 flex flex-col">
	<Breadcrumb crumbs={[{ label: 'Danh sách hoá đơn' }]} highlight />
	<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Danh sách hoá đơn</h1>
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
							{#if selectedSingleFilterType.value === 'patientName'}
								<Field {form} name="patientName">
									<Control let:attrs>
										<input
											type="text"
											placeholder="Nhập tên bệnh nhân..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto"
											{...attrs}
											bind:value={$formData.patientName}
										/>
									</Control>
								</Field>
							{:else if selectedSingleFilterType.value === 'phone'}
								<Field {form} name="patientName">
									<Control let:attrs>
										<input
											type="text"
											placeholder="Nhập số điện thoại..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto"
											{...attrs}
											bind:value={$formData.phoneNumber}
										/>
									</Control>
								</Field>
							{:else if selectedSingleFilterType.value === 'email'}
								<Field {form} name="patientName">
									<Control let:attrs>
										<input
											type="text"
											placeholder="Nhập email..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto"
											{...attrs}
											bind:value={$formData.email}
										/>
									</Control>
								</Field>
							{:else if selectedSingleFilterType.value === 'doctorName'}
								<Field {form} name="patientName">
									<Control let:attrs>
										<input
											type="text"
											placeholder="Nhập tên bác sĩ..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto"
											{...attrs}
											bind:value={$formData.doctorName}
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
								<Field {form} name="patientName">
									<Control let:attrs>
										<Label class="text-sm font-semibold text-surface-500 select-none">
											Tên bệnh nhân
										</Label>
										<input
											type="text"
											placeholder="Nhập tên bệnh nhân..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 mt-1"
											{...attrs}
											bind:value={$formData.patientName}
										/>
									</Control>
								</Field>
							</div>
							<div>
								<Field {form} name="phoneNumber">
									<Control let:attrs>
										<Label class="text-sm font-semibold text-surface-500 select-none">
											Số điện thoại
										</Label>
										<input
											type="text"
											placeholder="Nhập số điện thoại..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 mt-1"
											{...attrs}
											bind:value={$formData.phoneNumber}
										/>
									</Control>
								</Field>
							</div>
							<div>
								<Field {form} name="email">
									<Control let:attrs>
										<Label class="text-sm font-semibold text-surface-500 select-none">Email</Label>
										<input
											type="text"
											placeholder="Nhập email..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 mt-1"
											{...attrs}
											bind:value={$formData.email}
										/>
									</Control>
								</Field>
							</div>
							<div>
								<Field {form} name="doctorName">
									<Control let:attrs>
										<Label class="text-sm font-semibold text-surface-500 select-none">
											Tên bác sĩ
										</Label>
										<input
											type="text"
											placeholder="Nhập tên bác sĩ..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 mt-1"
											{...attrs}
											bind:value={$formData.doctorName}
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
			groupFn={(item) => formatCompactDate(item.examinationDate)}
			on:pageChange={(e) => {
				currentPage = e.detail;
				filtering(lastestFilterOption, e.detail, pageSize, true);
			}}
			on:sortField={(e) => selectSorting(e.detail)}
			let:field
			let:fieldData
		>
			<svelte:fragment slot="action-cell" let:item>
				<button
					type="button"
					class="btn btn-sm font-semibold mx-auto block {item.status ===
					RecordStatus.WAITTINGPAYMENT
						? 'variant-filled-primary'
						: 'variant-outline-tertiary text-tertiary-500 bg-white'}"
					on:click={() => {
						showDetail(item.recordId);
					}}
				>
					{item.status === RecordStatus.WAITTINGPAYMENT ? 'Thanh toán' : 'Chi tiết'}
				</button>
			</svelte:fragment>
			{#if field?.name === 'status'}
				<td class="text-center">
					{#if fieldData.status === RecordStatus.WAITTINGPAYMENT}
						<span class="badge variant-soft-warning">Chưa thanh toán</span>
					{:else if fieldData.status === RecordStatus.END}
						<span class="badge variant-soft-success">Đã thanh toán</span>
					{/if}
				</td>
			{:else if field?.name === 'examinationDate'}
				<td class="text-center">{formatCompactDateTime(fieldData.examinationDate)}</td>
			{:else if field}
				<td>{fieldData[field.name]}</td>
			{/if}
		</DataTable>
	</div>
</Container>
