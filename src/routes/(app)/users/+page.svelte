<script lang="ts">
	import { Role, roleTranslation, userRoles } from '$lib/authorization';
	import { formatCurrency } from '$lib/helpers/formatters';
	import { type Selected, ToggleGroup, Dialog } from 'bits-ui';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import type { PageData } from './$types';
	import { userFilterSchema } from '$lib/form-schemas/user-filter-schema';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms';
	import { Control, Field, Label } from 'formsnap';
	import type { z } from 'zod';
	import endpoints from '$lib/endpoints';
	import { isEqual } from 'lodash-es';
	import CreateUserForm from '$lib/components/users/CreateUserForm.svelte';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import EditUserForm from '$lib/components/users/EditUserForm.svelte';
	import DropdownSelect from '$lib/components/common/DropdownSelect.svelte';
	import DataTable from '$lib/components/common/DataTable.svelte';
	import Breadcrumb from '$lib/components/common/Breadcrumb.svelte';
	import { type Writable } from 'svelte/store';
	import { getContext } from 'svelte';
	import Container from '$lib/components/common/Container.svelte';

	export let data: PageData;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const modalStore = getModalStore();
	const form = superForm(data.userFilterForm, {
		SPA: true,
		id: 'single',
		invalidateAll: false,
		resetForm: false,
		validators: zodClient(userFilterSchema),
		onChange: ({ get, paths }) => {
			if (advancedFilterOpen) {
				return;
			}

			let inputData: Partial<z.infer<typeof userFilterSchema>> = {};
			switch (paths[0]) {
				case 'name':
				case 'email':
				case 'phone':
					inputData[paths[0]] = get(paths[0]);
					break;
				case 'fromSalary':
				case 'toSalary':
					inputData.fromSalary = get('fromSalary');
					inputData.toSalary = get('toSalary');
					break;
			}

			filtering(inputData, 1, pageSize, false, false, true);
		},
		onUpdate: ({ form }) => {
			filtering(form.data, 1, pageSize, true, false, true);
		}
	});
	const { form: formData, enhance } = form;
	const tableFields: TableField<User>[] = [
		{
			displayName: 'Họ và tên',
			name: 'name',
			sortable: true,
			align: 'left'
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
			displayName: 'Lương',
			name: 'salary',
			sortable: true,
			align: 'right',
			formatter: formatCurrency
		},
		{
			displayName: 'Vai trò',
			name: 'roles'
		}
	];
	const sortableField = tableFields.filter((x) => x.sortable).map((x) => x.name);
	const singleFilterTypes: Selected<keyof User>[] = [
		{
			label: 'Họ và tên',
			value: 'name'
		},
		{
			label: 'Email',
			value: 'email'
		},
		{
			label: 'Số điện thoại',
			value: 'phone'
		},
		{
			label: 'Lương',
			value: 'salary'
		}
	];
	let users = data.userListPage.data;
	let pageSize = data.userListPage.pageSize || 10;
	let currentPage = data.userListPage.pageNumber || 1;
	let totalItems = data.userListPage.totalRecords || 0;
	let sortingField: keyof User | undefined;
	let sortingAscending = false;
	let selectedSingleFilterType = singleFilterTypes[0];
	let advancedFilterOpen = false;
	let filterTimer: NodeJS.Timeout | undefined;
	let lastestFilterOption: Partial<z.infer<typeof userFilterSchema>> = {};
	let lastestFilterOptionExtended: Record<string, string | string[]> = {};
	let createUserFormCloseBtn: HTMLButtonElement;
	let loading = false;

	function createUserFinish() {
		filtering(lastestFilterOption, currentPage, pageSize, true, true);
		createUserFormCloseBtn?.click();
	}

	function resetPage() {
		filtering({}, 1, pageSize, true, false, true);
	}

	function advancedFilterClick() {
		advancedFilterOpen = !advancedFilterOpen;
		form.reset();
		resetPage();
	}

	function filtering(
		filterOptions: Partial<z.infer<typeof userFilterSchema>>,
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
				const filterOptionsExtended: Record<string, string | string[]> = {
					page: String(page),
					size: String(size)
				};
				if (sortingField) {
					filterOptionsExtended.orderBy = sortingField;
					filterOptionsExtended.asc = String(sortingAscending);
				}
				if (filterOptions.name) {
					filterOptionsExtended.name = filterOptions.name ?? '';
				}
				if (filterOptions.email) {
					filterOptionsExtended.email = filterOptions.email ?? '';
				}
				if (filterOptions.phone) {
					filterOptionsExtended.phone = filterOptions.phone ?? '';
				}
				if (filterOptions.fromSalary) {
					filterOptionsExtended.fromSalary = String(filterOptions.fromSalary);
				}
				if (filterOptions.toSalary) {
					filterOptionsExtended.toSalary = String(filterOptions.toSalary);
				}
				if (filterOptions.roles && filterOptions.roles.length > 0) {
					filterOptionsExtended.roles = filterOptions.roles;
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
				const url = `${endpoints.users.get}?${searchParams}`;
				// loading = true;
				try {
					const response = await fetch(url, {
						headers: {
							Authorization: `Bearer ${$userStore.token}`
						}
					});

					if (response.ok) {
						lastestFilterOption = filterOptions;
						lastestFilterOptionExtended = filterOptionsExtended;
						const pageData: Pagination<User[]> = await response.json();
						pageData.data.forEach((x) => (x.birthday = new Date(x.birthday)));
						users = pageData.data;
						totalItems = pageData.totalRecords;
						if (resetCurrentPage) {
							currentPage = 1;
						}
					}
				} catch (error) {
					console.log(error);
				} finally {
					// loading = false;
				}
			},
			ignoreDelay ? 0 : 400
		);
	}

	function toggleRoleFilterSelection() {
		if ($formData.roles.length === 0) {
			$formData.roles = [...userRoles];
		} else {
			$formData.roles = [];
		}
	}

	function selectSorting(field: keyof User | undefined) {
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

	function openEditUser(user: User) {
		const modalSetting: ModalSettings = {
			type: 'component',
			component: {
				ref: EditUserForm,
				props: {
					editUserForm: data.editUserForm,
					user
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
	<title>Danh sách nhân viên</title>
</svelte:head>
<Container heightFull heightScreenMin paddingTopHeader class="pt-4 flex flex-col">
	<Breadcrumb crumbs={[{ label: 'Danh sách nhân viên' }]} highlight />
	<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Danh sách nhân viên</h1>
	<div class="p-8 bg-slate-300 rounded-t-2xl space-y-6 flex-1">
		<div class="p-2 rounded-xl bg-white shadow-md group">
			<div class="p-1 bg-slate-300 shadow-inner flex gap-1 rounded-lg overflow-hidden">
				<DropdownSelect
					items={singleFilterTypes}
					disabled={advancedFilterOpen}
					bind:selected={selectedSingleFilterType}
					onSelectedChange={() => form.reset()}
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
											placeholder="Nhập tên nhân viên..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto"
											{...attrs}
											bind:value={$formData.name}
										/>
									</Control>
								</Field>
							{:else if selectedSingleFilterType.value === 'email'}
								<Field {form} name="email">
									<Control let:attrs>
										<input
											type="text"
											placeholder="Nhập email nhân viên..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto"
											{...attrs}
											bind:value={$formData.email}
										/>
									</Control>
								</Field>
							{:else if selectedSingleFilterType.value === 'phone'}
								<Field {form} name="phone">
									<Control let:attrs>
										<input
											type="text"
											placeholder="Nhập sđt nhân viên..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 w-auto"
											{...attrs}
											bind:value={$formData.phone}
											on:keypress={(e) => false}
										/>
									</Control>
								</Field>
							{:else if selectedSingleFilterType.value === 'salary'}
								<Field {form} name="fromSalary">
									<Control let:attrs>
										<input
											type="number"
											placeholder="Từ..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 w-28 text-center"
											{...attrs}
											bind:value={$formData.fromSalary}
										/>
									</Control>
								</Field>
								<div class="border-t-2 border-surface-900 border-dashed w-14"></div>
								<Field {form} name="toSalary">
									<Control let:attrs>
										<input
											type="number"
											placeholder="đến..."
											class="input rounded-md bg-white/70 focus-within:bg-white/100 w-28 text-center"
											{...attrs}
											bind:value={$formData.toSalary}
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
						<span class="pl-2">Thêm nhân viên</span>
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
							<CreateUserForm createUserForm={data.createUserForm} on:finish={createUserFinish}>
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
							</CreateUserForm>
						</Dialog.Content>
					</Dialog.Portal>
				</Dialog.Root>
			</div>
			<div
				class="grid {advancedFilterOpen
					? 'grid-rows-[1fr]'
					: 'grid-rows-[0fr]'} transition-all duration-200 ease-out"
			>
				<div class="overflow-hidden">
					<form method="post" use:enhance class="p-6 pt-8">
						<div class="flex justify-between gap-x-8 gap-y-6 flex-wrap">
							<div>
								<Field {form} name="name">
									<Control let:attrs>
										<Label class="text-sm font-semibold text-surface-500 select-none"
											>Họ và tên</Label
										>
										<input
											type="text"
											placeholder="Nhập tên nhân viên..."
											class="input rounded-md bg-white w-auto mt-1"
											{...attrs}
											bind:value={$formData.name}
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
											placeholder="Nhập email nhân viên..."
											class="input rounded-md bg-white w-auto mt-1"
											{...attrs}
											bind:value={$formData.email}
										/>
									</Control>
								</Field>
							</div>
							<div>
								<Field {form} name="phone">
									<Control let:attrs>
										<Label class="text-sm font-semibold text-surface-500 select-none"
											>Số điện thoại</Label
										>
										<input
											type="text"
											placeholder="Nhập sđt nhân viên..."
											class="input rounded-md bg-white w-auto mt-1"
											{...attrs}
											bind:value={$formData.phone}
										/>
									</Control>
								</Field>
							</div>
							<div>
								<p class="text-sm font-semibold text-surface-500 select-none">Khoảng lương</p>
								<div class="flex gap-1 items-center mt-1">
									<Field {form} name="fromSalary">
										<Control let:attrs>
											<input
												type="number"
												placeholder="Từ..."
												class="input rounded-md bg-white w-28 text-center"
												{...attrs}
												bind:value={$formData.fromSalary}
											/>
										</Control>
									</Field>
									<div class="border-t-2 border-surface-900 border-dashed w-14"></div>
									<Field {form} name="toSalary">
										<Control let:attrs>
											<input
												type="number"
												placeholder="đến..."
												class="input rounded-md bg-white w-28 text-center"
												{...attrs}
												bind:value={$formData.toSalary}
											/>
										</Control>
									</Field>
								</div>
							</div>
							<div>
								<p class="text-sm font-semibold text-surface-500 select-none">Vai trò</p>
								<div class="flex gap-2 items-center mt-1">
									<ToggleGroup.Root
										bind:value={$formData.roles}
										class="flex rounded-lg border overflow-hidden"
									>
										{#each userRoles as userRole, i}
											{#if i !== 0}
												<div class="h-auto border-r"></div>
											{/if}
											<ToggleGroup.Item
												class="btn btn-sm rounded-none font-medium data-[state=on]:variant-filled-primary"
												value={userRole}>{roleTranslation[userRole]}</ToggleGroup.Item
											>
										{/each}
									</ToggleGroup.Root>
									<button
										type="button"
										class="btn btn-sm w-10 {$formData.roles.length === 0
											? 'variant-filled-secondary'
											: 'variant-filled-error'} rounded-lg"
										on:click={toggleRoleFilterSelection}
									>
										{#if $formData.roles.length === 0}
											<i class="fa-solid fa-check"></i>
										{:else}
											<i class="fa-solid fa-xmark"></i>
										{/if}
									</button>
								</div>
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
			bind:items={users}
			bind:currentPage
			bind:pageSize
			bind:totalItems
			bind:sortingField
			bind:sortingAscending
			bind:loading
			fields={tableFields}
			on:pageChange={(e) => {
				currentPage = e.detail;
				filtering(lastestFilterOption, e.detail, pageSize, true);
			}}
			on:sortField={(e) => selectSorting(e.detail)}
			on:edit={(e) => openEditUser(e.detail)}
			let:fieldData
			let:field
		>
			{#if field.name === 'name'}
				<td class="text-left">
					<a href="/users/{fieldData.id}" class="hover:underline">{fieldData.name}</a>
				</td>
			{:else if field.name === 'email'}
				<td class="text-left">{fieldData.email}</td>
			{:else if field.name === 'phone'}
				<td class="text-center">{fieldData.phone}</td>
			{:else if field.name === 'salary'}
				<td class="text-end">{formatCurrency(fieldData.salary)}</td>
			{:else if field.name === 'roles'}
				<td class="text-center text-sm font-semibold">
					<div class="flex flex-col items-center gap-y-1">
						{#each fieldData.roles as uRole (uRole)}
							{#if uRole === Role.Admin}
								<span class="bg-red-200 text-red-600 px-2 py-1 rounded-full w-fit">
									{roleTranslation[Role.Admin]}
								</span>
							{:else if uRole === Role.Doctor}
								<span class="bg-sky-200 text-sky-600 px-2 py-1 rounded-full w-fit">
									{roleTranslation[Role.Doctor]}
								</span>
							{:else if uRole === Role.Nurse}
								<span class="bg-green-200 text-green-700 px-2 py-1 rounded-full w-fit">
									{roleTranslation[Role.Nurse]}
								</span>
							{:else if uRole === Role.Recieptionist}
								<span class="bg-orange-200 text-orange-600 px-2 py-1 rounded-full w-fit">
									{roleTranslation[Role.Recieptionist]}
								</span>
							{:else if uRole === Role.Accountant}
								<span class="bg-violet-200 text-violet-600 px-2 py-1 rounded-full w-fit">
									{roleTranslation[Role.Accountant]}
								</span>
							{/if}
						{/each}
					</div>
				</td>
			{:else}
				<td class="text-left">{fieldData[field.name]}</td>
			{/if}
		</DataTable>
	</div>
</Container>
