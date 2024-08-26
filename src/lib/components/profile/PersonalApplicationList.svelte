<script lang="ts">
	import Breadcrumb from '$lib/components/common/Breadcrumb.svelte';
	import Container from '$lib/components/common/Container.svelte';
	import { Checkbox, type Selected } from 'bits-ui';
	import DropdownSelect from '$lib/components/common/DropdownSelect.svelte';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { getContext, onMount, type ComponentEvents } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { z } from 'zod';
	import endpoints from '$lib/endpoints';
	import isEqual from 'lodash-es/isEqual';
	import { fly } from 'svelte/transition';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import DataTable from '$lib/components/common/DataTable.svelte';
	import { formatCompactDateTime } from '$lib/helpers/formatters';
	import { applicationFilterSchema } from '$lib/form-schemas/application-filter-schema';
	import DateRangePicker from '$lib/components/common/DateRangePicker.svelte';
	import { createApplicationSchema } from '$lib/form-schemas/create-application-schema';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import ApplicationForm from './ApplicationForm.svelte';
	import DatePicker from '../common/DatePicker.svelte';
	import { toast } from 'svelte-sonner';
	import { handleToastFetch } from '$lib/helpers/utils';
	import ApplicationDetail from './ApplicationDetail.svelte';

	export let applicationFilterForm: SuperValidated<z.infer<typeof applicationFilterSchema>>;
	export let createApplicationForm: SuperValidated<z.infer<typeof createApplicationSchema>>;

	const modalStore = getModalStore();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const tableFields: TableField<Application>[] = [
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
			displayName: 'Trạng thái xác nhận',
			name: 'isConfirm',
			sortable: false,
			align: 'center'
		}
	];
	const sortableField = tableFields.filter((x) => x?.sortable).map((x) => x!.name);
	const form = superForm(applicationFilterForm, {
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
	const { form: formData } = form;
	let applications: Application[] = [];
	let advancedFilterOpen = false;
	let filterTimer: NodeJS.Timeout | undefined;
	let pageSize = 10;
	let currentPage = 1;
	let totalItems = 0;
	let sortingAscending = false;
	let sortingField: keyof Application | undefined;
	let lastestFilterOption: Partial<z.infer<typeof applicationFilterSchema>> = {};
	let lastestFilterOptionExtended: Record<string, string | Date | boolean> = {};
	let loading = false;
	let refreshTrigger = Math.random();
	let isPatientConfirm: 0 | 1 | 2 = 2;
	let checboxState: [true, false, 'indeterminate'] = [true, false, 'indeterminate'];

	onMount(() => {
		resetPage();
	});

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
				const url = `${endpoints.application.getByUser}?${searchParams}`;

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

		filtering(lastestFilterOption, currentPage, pageSize, true, true);
	}

	function showCreateForm() {
		const modalSetting: ModalSettings = {
			type: 'component',
			component: {
				ref: ApplicationForm,
				props: {
					createApplicationForm
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

	function showEditForm(application: Application) {
		const modalSetting: ModalSettings = {
			type: 'component',
			component: {
				ref: ApplicationForm,
				props: {
					createApplicationForm,
					application
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

	function showDetail(application: Application) {
		const modalSetting: ModalSettings = {
			type: 'component',
			component: {
				ref: ApplicationDetail,
				props: {
					application
				}
			}
		};
		modalStore.trigger(modalSetting);
	}

	function showDeleteForm(application: Application) {
		if (!$userStore) {
			return;
		}

		const modalSetting: ModalSettings = {
			type: 'confirm',
			title: 'Xác nhận',
			body: `Xác nhận xoá đơn nghỉ từ ${formatCompactDateTime(application.startAt)} đến ${formatCompactDateTime(application.endAt)}.`,
			response: (r) => {
				if (!r) {
					return;
				}

				toast.promise(
					handleToastFetch(
						fetch(endpoints.application.delete(application.id), {
							method: 'DELETE',
							headers: {
								'content-type': 'application/json',
								Authorization: `Bearer ${$userStore.token}`
							}
						}),
						{ success: 'Xoá đơn nghỉ thành công' },
						() => filtering(lastestFilterOption, currentPage, pageSize, true, true)
					),
					{
						loading: 'Đang xử lý...',
						success: (msg) => msg ?? 'Xoá đơn nghỉ thành công',
						error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình xoá đơn nghỉ'
					}
				);
			}
		};

		modalStore.trigger(modalSetting);
	}

	function onStartDateChange(e: ComponentEvents<DatePicker>['valueChange']) {
		$formData.startAt = e.detail;
	}

	function onEndDateChange(e: ComponentEvents<DatePicker>['valueChange']) {
		$formData.endAt = e.detail;
	}
</script>

<div class="rounded-lg shadow-lg overflow-hidden border mt-8 bg-white">
	<div class="py-4 px-6 border-b flex items-center">
		<h3 class="h4 sm:h3 font-semibold">Đơn nghỉ</h3>
		<button class="btn btn-sm variant-filled-tertiary ml-auto" on:click={showCreateForm}>
			<i class="fa-solid fa-plus"></i>
			<span>Thêm</span>
		</button>
	</div>
	<div class="space-y-6 pb-4">
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
			rounded={false}
			padding={false}
			shadow={false}
			alternativeRow={false}
			grid
			on:pageChange={(e) => {
				currentPage = e.detail;
				filtering(lastestFilterOption, e.detail, pageSize, true);
			}}
			on:sortField={(e) => selectSorting(e.detail)}
		>
			<svelte:fragment slot="first-row">
				<tr class="border-b bg-slate-100">
					<td class="border-r"></td>
					<td class="border-r px-4">
						<DatePicker
							granularity="minute"
							regionInput="border-none bg-transparent w-fit mx-auto"
							on:valueChange={onStartDateChange}
						/>
					</td>
					<td class="border-r px-4">
						<DatePicker
							granularity="minute"
							regionInput="border-none bg-transparent w-fit mx-auto"
							on:valueChange={onEndDateChange}
						/>
					</td>
					<td class="border-r align-middle">
						<div class="flex justify-center items-center">
							<button
								type="button"
								class="checkbox text-sm text-white {checboxState[isPatientConfirm]
									? 'bg-primary-500 border-none'
									: 'bg-white'}"
								on:click={() => {
									isPatientConfirm = (isPatientConfirm + 1) % 3;

									const state = checboxState[isPatientConfirm];
									if (state === 'indeterminate') {
										$formData.isConfirm = undefined;
									} else {
										$formData.isConfirm = state;
									}
								}}
							>
								{#if checboxState[isPatientConfirm] === 'indeterminate'}
									<i class="fa-solid fa-minus"></i>
								{:else if checboxState[isPatientConfirm]}
									<i class="fa-solid fa-check"></i>
								{/if}
							</button>
						</div>
					</td>
					<td></td>
				</tr>
			</svelte:fragment>
			<svelte:fragment slot="action-cell" let:item>
				<div class="flex gap-x-1 justify-center">
					<button
						type="button"
						class="{item.isConfirm
							? 'btn btn-sm'
							: 'btn-icon btn-icon-sm'} variant-filled-tertiary font-medium"
						on:click={() => showDetail(item)}
					>
						<i class="fa-regular fa-circle-info"></i>
						{#if item.isConfirm}
							<span class="ml-1">Chi tiết</span>
						{/if}
					</button>
					{#if !item.isConfirm}
						<button
							type="button"
							class="btn-icon btn-icon-sm variant-filled-primary font-medium"
							on:click={() => showEditForm(item)}
						>
							<i class="fa-solid fa-pen-to-square"></i>
						</button>
						<button
							type="button"
							class="btn-icon btn-icon-sm variant-filled-error font-medium"
							on:click={() => showDeleteForm(item)}
						>
							<i class="fa-regular fa-trash-can"></i>
						</button>
					{/if}
				</div>
			</svelte:fragment>
		</DataTable>
	</div>
</div>
