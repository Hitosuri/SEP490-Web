<script lang="ts">
	import Breadcrumb from '$lib/components/common/Breadcrumb.svelte';
	import Container from '$lib/components/common/Container.svelte';
	import type { Selected } from 'bits-ui';
	import type { PageData } from './$types';
	import DropdownSelect from '$lib/components/common/DropdownSelect.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { getContext, type ComponentEvents } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { z } from 'zod';
	import endpoints from '$lib/endpoints';
	import isEqual from 'lodash-es/isEqual';
	import { fly } from 'svelte/transition';
	import { Control, Field, Label } from 'formsnap';
	import DataTable from '$lib/components/common/DataTable.svelte';
	import { formatCompactDateTime } from '$lib/helpers/formatters';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import { applicationFilterSchema } from '$lib/form-schemas/application-filter-schema';
	import DateRangePicker from '$lib/components/common/DateRangePicker.svelte';
	import ApplicationDetail from '$lib/components/profile/ApplicationDetail.svelte';

	export let data: PageData;

	const modalStore = getModalStore();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const tableFields: TableField<Application>[] = [
		{
			displayName: 'Tên',
			name: 'userName',
			sortable: true,
			align: 'left'
		},
		{
			displayName: 'Từ',
			name: 'startAt',
			sortable: true,
			align: 'center',
			formatter: formatCompactDateTime
		},
		{
			displayName: 'Đến',
			name: 'endAt',
			sortable: true,
			align: 'center',
			formatter: formatCompactDateTime
		},
		{
			displayName: 'Được xác nhận',
			name: 'isConfirm',
			sortable: false,
			align: 'center'
		}
	];
	const sortableField = tableFields.filter((x) => x?.sortable).map((x) => x!.name);
	const singleFilterTypes: Selected<keyof Application>[] = [
		{
			label: 'Tên nhân viên',
			value: 'userName'
		},
		{
			label: 'Thời gian nghỉ',
			value: 'startAt'
		},
		{
			label: 'Trạng thái xác nhận',
			value: 'isConfirm'
		}
	];
	const form = superForm(data.applicationFilterForm, {
		SPA: true,
		id: 'single',
		invalidateAll: false,
		resetForm: false,
		validators: zodClient(applicationFilterSchema),
		onChange: ({ get, paths }) => {
			if (advancedFilterOpen) {
				return;
			}

			let inputData: Partial<z.infer<typeof applicationFilterSchema>> = {};

			switch (paths[0]) {
				case 'userName':
					inputData.userName = get('userName');
					break;
				case 'isConfirm':
					inputData.isConfirm = get('isConfirm');
					break;
				case 'startAt':
				case 'endAt':
					inputData.startAt = get('startAt');
					inputData.endAt = get('endAt');
					break;
			}
			filtering(inputData, 1, pageSize, false, false, true);
		},
		onUpdate: ({ form }) => {
			const filteredSearchParams: Partial<z.infer<typeof applicationFilterSchema>> = {
				...form.data
			};
			Object.entries(filteredSearchParams).forEach((x) => {
				if (x[1] == null) {
					delete filteredSearchParams[x[0] as keyof typeof filteredSearchParams];
				}
			});
			filtering(filteredSearchParams, 1, pageSize, true, false, true);
		}
	});
	const { form: formData, enhance } = form;
	let applications = data.applicationListPage.data;
	let advancedFilterOpen = false;
	let selectedSingleFilterType = singleFilterTypes[0];
	let filterTimer: NodeJS.Timeout | undefined;
	let pageSize = data.applicationListPage.pageSize || 10;
	let currentPage = data.applicationListPage.pageNumber || 1;
	let totalItems = data.applicationListPage.totalRecords || 0;
	let sortingAscending = false;
	let sortingField: keyof Application | undefined;
	let lastestFilterOption: Partial<z.infer<typeof applicationFilterSchema>> = {};
	let lastestFilterOptionExtended: Record<string, string | Date | boolean> = {};
	let loading = false;
	let refreshTrigger = Math.random();

	function filtering(
		filterOptions: Partial<z.infer<typeof applicationFilterSchema>>,
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

				const filterOptionsExtended: Record<string, string | Date | boolean> = {
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
					if (value == null) {
						continue;
					}
					searchParams.set(key, value instanceof Date ? value.toISOString() : String(value));
				}
				const url = `${endpoints.application.getByEmployee}?${searchParams}`;

				try {
					const response = await fetch(url, {
						headers: {
							Authorization: `Bearer ${$userStore.token}`
						}
					});

					if (response.ok) {
						const pageData: Pagination<Application[]> = await response.json();

						pageData.data.forEach((x) => {
							x.startAt = new Date(x.startAt);
							x.endAt = new Date(x.endAt);
						});

						applications = pageData.data;
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
		refreshTrigger = Math.random();
	}

	function selectSorting(field: keyof Application | undefined) {
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

	function onDateChange(e: ComponentEvents<DateRangePicker>['valueChange']) {
		if (!e.detail) {
			$formData.startAt = undefined;
			$formData.endAt = undefined;
		} else {
			$formData.startAt = e.detail[0];
			$formData.endAt = e.detail[1];
		}
	}

	function showDetail(application: Application, showAsConfirm = false) {
		const modalSetting: ModalSettings = {
			type: 'component',
			component: {
				ref: ApplicationDetail,
				props: {
					application,
					showAsConfirm
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

<svelte:head>
	<title>Danh sách đơn nghỉ</title>
</svelte:head>
<Container heightFull heightScreenMin paddingTopHeader class="pt-4 flex flex-col">
	<Breadcrumb crumbs={[{ label: 'Danh sách đơn nghỉ' }]} highlight />
	<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Danh sách đơn nghỉ</h1>
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
						<fieldset class="flex gap-1 items-center h-full" disabled={advancedFilterOpen}>
							{#if selectedSingleFilterType.value === 'userName'}
								<Field {form} name="userName">
									<Control let:attrs>
										<input
											type="text"
											maxlength={255}
											placeholder="Nhập tên nhân viên..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto"
											{...attrs}
											bind:value={$formData.userName}
										/>
									</Control>
								</Field>
							{:else if selectedSingleFilterType.value === 'startAt'}
								{#key refreshTrigger}
									<DateRangePicker
										regionInput="!bg-white"
										on:valueChange={onDateChange}
										granularity="minute"
									/>
								{/key}
							{:else if selectedSingleFilterType.value === 'isConfirm'}
								<Field {form} name="isConfirm">
									<Control let:attrs>
										<div class="flex gap-3 ml-4">
											<Label
												class="text-sm font-semibold {$formData.isConfirm
													? 'text-primary-500'
													: 'text-surface-500'} select-none"
											>
												Đã xác nhận
											</Label>
											<input
												type="checkbox"
												class="checkbox bg-white"
												{...attrs}
												bind:checked={$formData.isConfirm}
											/>
											<Label
												class="text-sm font-semibold {$formData.isConfirm
													? 'text-surface-500'
													: 'text-primary-500'} select-none"
											>
												Chưa xác nhận
											</Label>
										</div>
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
						<div class="grid grid-cols-12 gap-x-8 gap-y-6 flex-wrap">
							<div class="col-span-4">
								<Field {form} name="userName">
									<Control let:attrs>
										<Label class="text-sm font-semibold text-surface-500 select-none">
											Tên nhân viên
										</Label>
										<input
											type="text"
											placeholder="Nhập tên nhân viên..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 mt-1"
											{...attrs}
											bind:value={$formData.userName}
										/>
									</Control>
								</Field>
							</div>
							<div class="col-span-8 2xl:col-span-6">
								{#key refreshTrigger}
									<p class="text-sm font-semibold text-surface-500 select-none mb-1">
										Thời gian nghỉ
									</p>
									<DateRangePicker
										regionInput="!bg-white"
										on:valueChange={onDateChange}
										granularity="minute"
									/>
								{/key}
							</div>
							<div class="col-span-12 2xl:col-span-2">
								<Field {form} name="userName">
									<Control let:attrs>
										<Label class="text-sm font-semibold text-surface-500 select-none mb-1">
											Trạng thái xác nhận
										</Label>
										<div class="flex h-[42px] items-center">
											<input
												type="checkbox"
												class="checkbox bg-white mx-2"
												{...attrs}
												bind:checked={$formData.isConfirm}
											/>
											<Label
												class="text-sm font-semibold {$formData.isConfirm
													? 'text-primary-500'
													: 'text-surface-500'} select-none"
											>
												{$formData.isConfirm ? 'Đã xác nhận' : 'Chưa xác nhận'}
											</Label>
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
		</div>
		<DataTable
			bind:items={applications}
			bind:currentPage
			bind:pageSize
			bind:totalItems
			bind:sortingField
			bind:sortingAscending
			bind:loading
			fields={tableFields}
			showDelete={false}
			showEdit={false}
			on:pageChange={(e) => {
				currentPage = e.detail;
				filtering(lastestFilterOption, e.detail, pageSize, true);
			}}
			on:sortField={(e) => selectSorting(e.detail)}
		>
			<svelte:fragment slot="action-cell" let:item>
				{#if item.isConfirm}
					<button
						type="button"
						class="btn btn-sm variant-soft-tertiary font-medium"
						on:click={() => showDetail(item)}
					>
						Chi tiết
					</button>
				{:else}
					<button
						type="button"
						class="btn btn-sm variant-filled-primary font-medium"
						on:click={() => showDetail(item, true)}
					>
						Xác nhận
					</button>
				{/if}
			</svelte:fragment>
		</DataTable>
	</div>
</Container>
