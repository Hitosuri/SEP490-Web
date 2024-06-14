<script lang="ts">
	import { Role, roleTranslation, userRoles } from '$lib/authorization';
	import { formatCurrency } from '$lib/helpers/util';
	import { DropdownMenu, Select, type Selected, Checkbox, ToggleGroup, Dialog } from 'bits-ui';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import type { PageData } from './$types';
	import { sortableField, userFilterSchema } from '$lib/form-schemas/user-filter-schema';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import { superForm, superValidate, type SuperValidated } from 'sveltekit-superforms';
	import { Control, Field, Label } from 'formsnap';
	import type { z } from 'zod';
	import endpoints from '$lib/endpoints';
	import userStore from '$lib/stores/user-store';
	import { isEqual } from 'lodash-es';
	import { Pagination } from 'bits-ui';
	import CreateUserForm from '$lib/components/users/CreateUserForm.svelte';
	import { onMount } from 'svelte';
	import { createUserSchema } from '$lib/form-schemas/create-user-schema';
	import { editUserSchema } from '$lib/form-schemas/edit-user-schema';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import EditUserForm from '$lib/components/users/EditUserForm.svelte';

	export let data: PageData;

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

			resetPageNumber();
			filtering(inputData, currentPage, pageSize);
		},
		onUpdate: ({ form }) => {
			resetPageNumber();
			filtering(form.data, currentPage, pageSize, true);
		}
	});
	const { form: formData, enhance } = form;
	const singleFilterTypes: Selected<(typeof sortableField)[number]>[] = [
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
	let extendedUsers = data.userListPage.data.map((x) => ({ user: x, selected: false }));
	let pageSize = data.userListPage.pageSize || 10;
	let currentPage = data.userListPage.pageNumber || 1;
	let totalItems = data.userListPage.totalRecords || 0;
	let paginationBinding = currentPage;
	let sortingField: (typeof sortableField)[number] | undefined;
	let sortingAscending = false;
	let selectedSingleFilterType = singleFilterTypes[0];
	let selectedUserCount = 0;
	let selectedAllState: boolean | 'indeterminate' = 'indeterminate';
	let openBatchMenu = false;
	let advancedFilterOpen = false;
	let filterTimer: NodeJS.Timeout | undefined;
	let lastestFilterOption: Partial<z.infer<typeof userFilterSchema>> = {};
	let lastestFilterOptionExtended: Record<string, string | string[]> = {};
	let createUserForm: SuperValidated<z.infer<typeof createUserSchema>> | undefined;
	let editUserForm: SuperValidated<z.infer<typeof editUserSchema>> | undefined;
	let createUserFormCloseBtn: HTMLButtonElement;

	$: selectedUserCount = extendedUsers.filter((x) => x.selected).length;
	$: openBatchMenu = selectedUserCount > 0;
	$: {
		if (selectedUserCount === 0) {
			selectedAllState = false;
		} else if (selectedUserCount === extendedUsers.length) {
			selectedAllState = true;
		} else {
			selectedAllState = 'indeterminate';
		}
	}

	onMount(async () => {
		createUserForm = await superValidate(zod(createUserSchema));
		editUserForm = await superValidate(zod(editUserSchema));
	});

	function createUserFinish() {
		filtering(lastestFilterOption, currentPage, pageSize, true, true);
		createUserFormCloseBtn?.click();
	}

	function resetPageNumber() {
		currentPage = 1;
		paginationBinding = currentPage;
	}

	function resetPage() {
		resetPageNumber();
		filtering({}, currentPage, pageSize, true);
	}

	function onSelectedAllStateChanged(checked: boolean | 'indeterminate') {
		if (typeof checked === 'boolean') {
			extendedUsers.forEach((x) => {
				x.selected = checked;
			});
		}
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
		forceFilter: boolean = false
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
				const response = await fetch(url, {
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				});

				if (response.ok) {
					lastestFilterOption = filterOptions;
					lastestFilterOptionExtended = filterOptionsExtended;
					const pageData: Pagination<User[]> = await response.json();
					extendedUsers = pageData.data.map((x) => ({ user: x, selected: false }));
					totalItems = pageData.totalRecords;
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

	function selectSorting(field: (typeof sortableField)[number] | undefined) {
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
					editUserForm,
					user
				}
			}
		};
		modalStore.trigger(modalSetting);
	}
</script>

<svelte:head>
	<title>Danh sách nhân viên</title>
</svelte:head>
<div class="px-4 pt-header h-full container mx-auto flex flex-col">
	<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Danh sách nhân viên</h1>
	<div class="p-8 bg-slate-300 rounded-t-2xl space-y-6 flex-1">
		<div class="p-2 rounded-xl bg-white shadow-md group">
			<div class="p-1 bg-slate-300 shadow-inner flex gap-1 rounded-lg overflow-hidden">
				<Select.Root
					disabled={advancedFilterOpen}
					items={singleFilterTypes}
					bind:selected={selectedSingleFilterType}
					onSelectedChange={() => form.reset()}
				>
					<Select.Trigger class="btn bg-white rounded-md">
						<i class="fa-regular fa-filter text-surface-300"></i>
						<span class="pl-1">Tìm theo:</span>
						<Select.Value class="font-semibold" />
						<div class="flex flex-col text-[0.55rem] pl-1 text-surface-400">
							<i class="fa-solid fa-chevron-up"></i>
							<i class="fa-solid fa-chevron-down"></i>
						</div>
					</Select.Trigger>

					<Select.Content
						class="w-full !min-w-40 rounded-md border border-surface-50 bg-white p-1 shadow-lg"
					>
						{#each singleFilterTypes as singleFilterType}
							<Select.Item
								value={singleFilterType.value}
								label={singleFilterType.label}
								class="data-[highlighted]:bg-primary-50 cursor-pointer data-[highlighted]:text-primary-500 px-4 py-3 rounded select-none flex gap-3 items-center h-10 justify-between"
							>
								<span class="font-semibold text-sm leading-4">{singleFilterType.label}</span>
								<Select.ItemIndicator class="select-none">
									<i class="fa-solid fa-check"></i>
								</Select.ItemIndicator>
							</Select.Item>
						{/each}
						<Select.Arrow />
					</Select.Content>
				</Select.Root>
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
							{#if createUserForm}
								<CreateUserForm {createUserForm} on:finish={createUserFinish}>
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
							{/if}
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
		<div class="bg-white p-2 rounded-xl shadow-md">
			<table class="w-full">
				<thead>
					<tr class="text-sm *:bg-slate-100 *:font-semibold *:text-surface-400">
						<th class="text-[0] table-cell-fit rounded-tl-lg rounded-bl-lg !pl-6">
							<Checkbox.Root
								class="checkbox {selectedAllState
									? 'bg-primary-500 border-none'
									: 'bg-white'} -translate-x-[2px] block"
								bind:checked={selectedAllState}
								onCheckedChange={onSelectedAllStateChanged}
							>
								<Checkbox.Indicator
									let:isChecked
									let:isIndeterminate
									class="*:block text-white text-sm"
								>
									{#if isChecked}
										<i class="fa-solid fa-check"></i>
									{:else if isIndeterminate}
										<i class="fa-solid fa-minus"></i>
									{/if}
								</Checkbox.Indicator>
							</Checkbox.Root>
						</th>
						<th class="text-start">
							<button
								class="btn btn-sm px-4 py-2 hover:text-surface-700 h-9"
								on:click={() => selectSorting('name')}
							>
								<span>Họ và tên</span>
								<div class="flex flex-col">
									<i
										class="fa-solid fa-caret-up -mb-2 {sortingField === 'name' && sortingAscending
											? 'text-primary-500'
											: 'opacity-40'}"
									></i>
									<i
										class="fa-solid fa-caret-down {sortingField === 'name' && !sortingAscending
											? 'text-primary-500'
											: 'opacity-40'}"
									></i>
								</div>
							</button>
						</th>
						<th class="text-start">
							<button
								class="btn btn-sm px-4 py-2 hover:text-surface-700 h-9"
								on:click={() => selectSorting('email')}
							>
								<span>Email</span>
								<div class="flex flex-col">
									<i
										class="fa-solid fa-caret-up -mb-2 {sortingField === 'email' && sortingAscending
											? 'text-primary-500'
											: 'opacity-40'}"
									></i>
									<i
										class="fa-solid fa-caret-down {sortingField === 'email' && !sortingAscending
											? 'text-primary-500'
											: 'opacity-40'}"
									></i>
								</div>
							</button>
						</th>
						<th class="">
							<button
								class="btn btn-sm px-4 py-2 hover:text-surface-700 h-9"
								on:click={() => selectSorting('phone')}
							>
								<span>Số điện thoại</span>
								<div class="flex flex-col">
									<i
										class="fa-solid fa-caret-up -mb-2 {sortingField === 'phone' && sortingAscending
											? 'text-primary-500'
											: 'opacity-40'}"
									></i>
									<i
										class="fa-solid fa-caret-down {sortingField === 'phone' && !sortingAscending
											? 'text-primary-500'
											: 'opacity-40'}"
									></i>
								</div>
							</button>
						</th>
						<th class="text-end">
							<button
								class="btn btn-sm px-4 py-2 hover:text-surface-700 h-9"
								on:click={() => selectSorting('salary')}
							>
								<span>Lương</span>
								<div class="flex flex-col">
									<i
										class="fa-solid fa-caret-up -mb-2 {sortingField === 'salary' && sortingAscending
											? 'text-primary-500'
											: 'opacity-40'}"
									></i>
									<i
										class="fa-solid fa-caret-down {sortingField === 'salary' && !sortingAscending
											? 'text-primary-500'
											: 'opacity-40'}"
									></i>
								</div>
							</button>
						</th>
						<th class="select-none">Vai trò</th>
						<th class="rounded-tr-lg rounded-br-lg w-0">
							<button
								class="btn btn-sm px-4 py-2 hover:text-surface-700 h-9"
								on:click={() => selectSorting(undefined)}
							>
								<i class="fa-solid fa-arrow-rotate-left"></i>
							</button>
						</th>
					</tr>
				</thead>
				<tbody>
					{#each extendedUsers as extendedUser (extendedUser.user.id)}
						<tr class="*:even:bg-slate-100 *:py-4 *:px-4 group">
							<td class="rounded-tl-lg rounded-bl-lg text-[0] relative overflow-hidden !pl-6">
								<input
									class="checkbox bg-white size-4"
									type="checkbox"
									name=""
									bind:checked={extendedUser.selected}
								/>
								<div
									class="absolute w-1 rounded-full h-2/3 left-2 top-1/2 -translate-y-1/2 bg-primary-400 {extendedUser.selected
										? 'block'
										: 'hidden'}"
								></div>
							</td>
							<td class="text-left">
								<a href="/users/{extendedUser.user.id}" class="hover:underline"
									>{extendedUser.user.name}</a
								>
							</td>
							<td class="text-left">{extendedUser.user.email}</td>
							<td class="text-center">{extendedUser.user.phone}</td>
							<td class="text-end">{formatCurrency(extendedUser.user.salary)}</td>
							<td class="text-center text-sm font-semibold">
								<div class="flex flex-col items-center gap-y-1">
									{#each extendedUser.user.roles as uRole (uRole)}
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
							<td class="rounded-tr-lg rounded-br-lg !py-0">
								<DropdownMenu.Root preventScroll={false}>
									<DropdownMenu.Trigger
										class="btn text-xl p-0 size-9 text-surface-400 hover:variant-soft-primary transition-all"
									>
										<i class="fa-solid fa-ellipsis"></i>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content
										transition={fly}
										transitionConfig={{
											duration: 200,
											y: 30,
											easing: cubicOut
										}}
										sideOffset={8}
										class="w-full max-w-36 rounded-md border border-surface-100 bg-white p-1 shadow-lg"
									>
										<DropdownMenu.Item
											href="/users/{extendedUser.user.id}"
											class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
										>
											<div class="size-4 text-center">
												<i class="fa-solid fa-circle-info block"></i>
											</div>
											<span class="font-semibold text-sm leading-4">Chi tiết</span>
										</DropdownMenu.Item>
										<DropdownMenu.Separator class="my-1 -ml-1 -mr-1 block h-px bg-surface-50" />
										<DropdownMenu.Item
											class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
											on:click={() => openEditUser(extendedUser.user)}
										>
											<div class="size-4 text-center">
												<i class="fa-regular fa-pen-to-square block"></i>
											</div>
											<span class="font-semibold text-sm leading-4">Sửa</span>
										</DropdownMenu.Item>
										<DropdownMenu.Item
											class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
										>
											<div class="size-4 text-center">
												<i class="fa-regular fa-trash-can block"></i>
											</div>
											<span class="font-semibold text-sm leading-4">Xoá</span>
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if totalItems > pageSize}
			<Pagination.Root
				count={totalItems}
				bind:page={paginationBinding}
				onPageChange={(page) => filtering(lastestFilterOption, page, pageSize, true)}
				perPage={pageSize}
				let:pages
				let:range
			>
				<div class="flex items-center justify-center">
					<Pagination.PrevButton
						class="mr-6 size-8 rounded-xl duration-200 bg-slate-200 hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-surface-400"
					>
						<i class="fa-solid fa-chevron-left"></i>
					</Pagination.PrevButton>
					<div class="flex items-center gap-3">
						{#each pages as page (page.key)}
							{#if page.type === 'ellipsis'}
								<div class="text-lg font-medium">...</div>
							{:else}
								<Pagination.Page
									{page}
									class="size-10 rounded-xl duration-200 bg-slate-300 hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-surface-400 data-[selected]:font-semibold data-[selected]:bg-white data-[selected]:shadow-md select-none"
								>
									{page.value}
								</Pagination.Page>
							{/if}
						{/each}
					</div>
					<Pagination.NextButton
						class="ml-6 size-8 rounded-xl duration-200 bg-slate-200 hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-surface-400"
					>
						<i class="fa-solid fa-chevron-right"></i>
					</Pagination.NextButton>
				</div>
				<p class="text-center text-[13px] text-muted-foreground mt-6">
					Hiển thị {range.start} - {range.end}
				</p>
			</Pagination.Root>
		{/if}
	</div>
</div>
{#if openBatchMenu}
	<div
		transition:fly={{
			duration: 200,
			y: 20,
			easing: cubicOut
		}}
		class="fixed p-4 bg-surface-900 left-1/2 bottom-8 -translate-x-1/2 flex items-center rounded-full gap-4"
	>
		<button
			on:click={() => (openBatchMenu = false)}
			class="btn-icon text-surface-400 hover:text-white hover:variant-soft-surface transition-all"
		>
			<i class="fa-solid fa-xmark"></i>
		</button>
		<div class="text-white">
			<span>Đã chọn</span>
			<span class="badge variant-soft-surface text-white px-3">{selectedUserCount}</span>
			<span>nhân viên</span>
		</div>
		<button class="btn variant-soft-surface text-white ml-10">
			<i class="fa-regular fa-pen-to-square text-xl text-surface-400"></i>
			<span>Sửa</span>
		</button>
		<button class="btn variant-filled-error">
			<i class="fa-regular fa-trash-can text-xl text-error-300"></i>
			<span>Xoá</span>
		</button>
	</div>
{/if}
