<script lang="ts">
	import { Role } from '$lib/authorization';
	import { formatCurrency } from '$lib/helpers/util';
	import { DropdownMenu, Select, type Selected, Checkbox } from 'bits-ui';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	const tmpUsers: User[] = Array(10)
		.fill(undefined)
		.map((_, i) => ({
			id: i,
			name: 'Lê Văn Quân',
			email: 'zedovblack@gmail.com',
			username: 'quanlv',
			phone: '0868480002',
			birthday: new Date(),
			salary: 8000000,
			status: 2,
			role: Role.Accountant
		}));
	const userRoles: Selected<string>[] = [
		Role.All,
		Role.Admin,
		Role.Accountant,
		Role.Doctor,
		Role.Nurse,
		Role.Recieptionist
	].map((x) => ({
		value: x,
		label: x === Role.All ? 'Tất cả' : x
	}));
	let sortingField: 'Name' | 'Email' | 'Phone' | 'Salary' | undefined;
	let salaryCompareType: 'eq' | 'le' | 'ge' | undefined;
	let extendedUsers: { user: User; selected: boolean }[] = [];
	let selectedUserCount = 0;
	let selectedAllState: boolean | 'indeterminate' = 'indeterminate';
	let openBatchMenu = false;

	$: extendedUsers = tmpUsers.map((x) => ({ user: x, selected: false }));
	$: selectedUserCount = extendedUsers.filter((x) => x.selected).length;
	$: {
		if (selectedUserCount === 0) {
			selectedAllState = false;
		} else if (selectedUserCount === extendedUsers.length) {
			selectedAllState = true;
		} else {
			selectedAllState = 'indeterminate';
		}
		openBatchMenu = selectedUserCount > 0;
	}

	function onSelectedAllStateChanged(checked: boolean | 'indeterminate') {
		if (checked === true) {
			extendedUsers.forEach((x) => (x.selected = true));
		} else {
			extendedUsers.forEach((x) => (x.selected = false));
		}
	}
</script>

<svelte:head>
	<title>Danh sách nhân viên</title>
</svelte:head>
<div class="px-4 pt-header h-full">
	<div class="p-4 bg-primary-50 rounded-tl-3xl rounded-tr-3xl h-full">
		<h1 class="h1">Danh sách nhân viên</h1>
		<div class="bg-white p-1">
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
						<th class="">
							<button class="btn btn-sm px-4 py-2 hover:text-surface-700 h-9">
								<span>Họ và tên</span>
								<div class="flex flex-col">
									<i class="fa-solid fa-caret-up -mb-2"></i>
									<i class="fa-solid fa-caret-down"></i>
								</div>
							</button>
						</th>
						<th class="">
							<button class="btn btn-sm px-4 py-2 hover:text-surface-700 h-9">
								<span>Email</span>
								<div class="flex flex-col">
									<i class="fa-solid fa-caret-up -mb-2"></i>
									<i class="fa-solid fa-caret-down"></i>
								</div>
							</button>
						</th>
						<th class="">
							<button class="btn btn-sm px-4 py-2 hover:text-surface-700 h-9">
								<span>Số điện thoại</span>
								<div class="flex flex-col">
									<i class="fa-solid fa-caret-up -mb-2"></i>
									<i class="fa-solid fa-caret-down"></i>
								</div>
							</button>
						</th>
						<th class="text-end">
							<button class="btn btn-sm px-4 py-2 hover:text-surface-700 h-9">
								<span>Lương</span>
								<div class="flex flex-col">
									<i class="fa-solid fa-caret-up -mb-2"></i>
									<i class="fa-solid fa-caret-down"></i>
								</div>
							</button>
						</th>
						<th>Vai trò</th>
						<th class="rounded-tr-lg rounded-br-lg w-0"></th>
					</tr>
				</thead>
				<tbody>
					{#each extendedUsers as extendedUser (extendedUser.user.id)}
						<tr class="*:even:bg-slate-100 *:py-3.5 *:px-4 group">
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
							<td class="text-left">{extendedUser.user.name}</td>
							<td class="text-left">{extendedUser.user.email}</td>
							<td class="text-center">{extendedUser.user.phone}</td>
							<td class="text-end">{formatCurrency(extendedUser.user.salary)}</td>
							<td class="text-center">{extendedUser.user.role}</td>
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
