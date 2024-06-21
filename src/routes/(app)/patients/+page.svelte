<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import type { PageData } from './$types';
	import DataTable from '$lib/components/common/DataTable.svelte';
	import { formatCompactDate } from '$lib/helpers/formatters';
	import Loading from '$lib/components/common/Loading.svelte';
	import userStore from '$lib/stores/user-store';
	import { isEqual } from 'lodash-es';
	import endpoints from '$lib/endpoints';
	import CreatePatientForm from '$lib/components/patients/CreatePatientForm.svelte';

	export let data: PageData;

	let patients = data.patientListPage.data;
	let pageSize = data.patientListPage.pageSize || 10;
	let currentPage = data.patientListPage.pageNumber || 1;
	let totalItems = data.patientListPage.totalRecords || 0;
	let sortingField: keyof Patient | undefined;
	let sortingAscending = false;
	let loading = false;
	let nameSearch = '';
	let phoneSearch = '';
	let lastestFilterOption: {
		name?: string;
		phoneNumber?: string;
	} = {};
	let lastestFilterOptionExtended: Record<string, string> = {};
	let filterTimer: NodeJS.Timeout | undefined;
	let createUserFormCloseBtn: HTMLButtonElement;
	const tableFields: TableField<Patient>[] = [
		{
			displayName: 'Họ và tên',
			name: 'name',
			sortable: true,
			align: 'left',
			href: (item) => `/patients/${item.id}`
		},
		{
			displayName: 'Email',
			name: 'email',
			sortable: true,
			align: 'left'
		},
		{
			displayName: 'Số điện thoại',
			name: 'phone',
			sortable: true
		},
		{
			displayName: 'Ngày sinh',
			name: 'birthday',
			sortable: true,
			align: 'center',
			formatter: formatCompactDate
		}
	];
	const sortableField = tableFields.filter((x) => x?.sortable).map((x) => x.name);

	$: searchChanged(nameSearch, phoneSearch);

	function createUserFinish() {
		filtering(lastestFilterOption, currentPage, pageSize, true, true);
		createUserFormCloseBtn?.click();
	}

	function searchChanged(nameSearch: string, phoneSearch: string) {
		const filterOption: typeof lastestFilterOption = {};
		if (nameSearch.trim()) {
			filterOption.name = nameSearch.trim();
		}
		if (phoneSearch.trim()) {
			filterOption.phoneNumber = phoneSearch.trim();
		}

		filtering(filterOption, 1, pageSize, false, false, true);
	}

	function filtering(
		filterOptions: typeof lastestFilterOption,
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

				const filterOptionsExtended: Record<string, string> = {
					...filterOptions,
					page: String(page),
					size: String(size)
				};

				if (sortingField) {
					filterOptionsExtended.orderBy = sortingField;
					filterOptionsExtended.asc = String(sortingAscending);
				}

				if (!forceFilter && isEqual(lastestFilterOptionExtended, filterOptionsExtended)) {
					return;
				}

				const searchParams = new URLSearchParams();
				for (const [key, value] of Object.entries(filterOptionsExtended)) {
					if (typeof value === 'string') {
						searchParams.set(key, value);
					}
					if (Array.isArray(value)) {
						value.forEach((x) => searchParams.append(key, x));
					}
				}
				const url = `${endpoints.patients.get}?${searchParams}`;

				try {
					const response = await fetch(url, {
						headers: {
							Authorization: `Bearer ${$userStore.token}`
						}
					});

					if (response.ok) {
						const pageData: Pagination<Patient[]> = await response.json();

						pageData.data.forEach((x) => {
							x.birthday = x.birthday ? new Date(x.birthday) : x.birthday;
						});
						patients = pageData.data;
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

	function selectSorting(field: keyof Patient | undefined) {
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
</script>

<svelte:head>
	<title>Danh sách bệnh nhân</title>
</svelte:head>
<div class="px-4 pt-header h-full container mx-auto flex flex-col">
	<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Danh sách bệnh nhân</h1>
	<div class="p-8 bg-slate-300 rounded-t-2xl space-y-6 flex-1">
		<div class="p-2 rounded-xl bg-white shadow-md group">
			<div class="p-1 bg-slate-300 shadow-inner flex gap-1 items-center rounded-lg overflow-hidden">
				<div class="relative">
					<input
						bind:value={nameSearch}
						type="text"
						placeholder="Tên bệnh nhân"
						class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto pl-12 transition-all focus:pl-3 peer"
					/>
					<div
						class="absolute top-0 left-0 pointer-events-none px-4 py-[9px] text-surface-400 transition-all peer-focus:opacity-0"
					>
						<i class="fa-regular fa-magnifying-glass"></i>
					</div>
				</div>
				<div class="relative">
					<input
						bind:value={phoneSearch}
						type="text"
						placeholder="Số điện thoại"
						class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto pl-12 transition-all focus:pl-3 peer"
					/>
					<div
						class="absolute top-0 left-0 pointer-events-none px-4 py-[9px] text-surface-400 transition-all peer-focus:opacity-0"
					>
						<i class="fa-regular fa-magnifying-glass"></i>
					</div>
				</div>
				<!-- <Loading class="px-2" /> -->
				<Dialog.Root>
					<Dialog.Trigger class="btn variant-filled-primary rounded-md font-medium ml-auto">
						<i class="fa-solid fa-plus"></i>
						<span class="pl-2">Thêm bệnh nhân</span>
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
							<CreatePatientForm
								createPatientForm={data.createPatientForm}
								on:finish={createUserFinish}
							>
								<svelte:fragment slot="closeBtn">
									<Dialog.Close asChild let:builder>
										<button
											use:builder.action
											{...builder}
											bind:this={createUserFormCloseBtn}
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
							</CreatePatientForm>
						</Dialog.Content>
					</Dialog.Portal>
				</Dialog.Root>
			</div>
		</div>
		<DataTable
			showDetail={tableFields[0].href}
			bind:items={patients}
			bind:currentPage
			bind:pageSize
			bind:totalItems
			bind:sortingField
			bind:sortingAscending
			bind:loading
			fields={tableFields}
			on:sortField={(e) => selectSorting(e.detail)}
		/>
	</div>
</div>
