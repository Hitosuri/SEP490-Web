<script lang="ts">
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { setError, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { type z } from 'zod';
	import Loading from '../common/Loading.svelte';
	import isEqual from 'lodash-es/isEqual';
	import endpoints from '$lib/endpoints';
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import CustomPagination from '../common/CustomPagination.svelte';
	import { Tooltip } from 'bits-ui';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { handleToastFetch, pascalToCamelcase } from '$lib/helpers/utils';
	import { createSupplierSchema } from '$lib/form-schemas/create-supplier-schema';

	export let createSupplierForm: SuperValidated<z.infer<typeof createSupplierSchema>>;
	export function onTabActive() {
		if (suppliersPromise) {
			return;
		}

		filtering(nameValue, phoneValue, currentPage, pageSize, true, true, true);
	}

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const form = superForm(createSupplierForm, {
		SPA: true,
		resetForm: false,
		validators: zodClient(createSupplierSchema),
		onUpdate: ({ form }) => {
			if (!$userStore || !form.valid) {
				return;
			}

			toast.promise(
				handleToastFetch(
					() => {
						const url = selectedSupplier
							? endpoints.suppliers.edit(selectedSupplier.id)
							: endpoints.suppliers.create;
						return fetch(url, {
							method: selectedSupplier ? 'PUT' : 'POST',
							headers: {
								'content-type': 'application/json',
								Authorization: `Bearer ${$userStore.token}`
							},
							body: JSON.stringify(form.data)
						});
					},
					{
						success: selectedSupplier
							? 'Cập nhật loại nhà cung cấp thành công'
							: 'Tạo loại nhà cung cấp thành công'
					},
					() => filtering(nameValue, phoneValue, currentPage, pageSize, true, true),
					form
				),
				{
					loading: 'Đang xử lý...',
					success: (msg) =>
						msg ?? selectedSupplier
							? 'Cập nhật loại nhà cung cấp thành công'
							: 'Tạo loại nhà cung cấp thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi'
				}
			);
		}
	});
	const { form: formData, enhance } = form;
	let nameValue = '';
	let phoneValue = '';
	let filterTimer: NodeJS.Timeout | undefined;
	let currentPage = 1;
	let totalItems = 0;
	let pageSize = 20;
	let suppliersPromise: Promise<Supplier[]> | undefined;
	let lastestFilterOption: Record<string, string> = {
		page: String(currentPage),
		size: String(pageSize),
		name: nameValue,
		phoneNumber: phoneValue
	};
	let selectedSupplier: Supplier | undefined;

	$: filtering(nameValue, phoneValue, 1, pageSize, false, false, true);

	function filtering(
		name: string,
		phoneNumber: string,
		page: number,
		size: number,
		ignoreDelay: boolean = false,
		forceFilter: boolean = false,
		resetCurrentPage: boolean = false
	) {
		name = name.trim();
		phoneNumber = phoneNumber.trim();

		const filterOption: Record<string, string> = {
			page: String(page),
			size: String(size),
			name: name,
			phoneNumber
		};

		if (!forceFilter && isEqual(lastestFilterOption, filterOption)) {
			return;
		}

		if (filterTimer) {
			clearTimeout(filterTimer);
			filterTimer = undefined;
		}

		filterTimer = setTimeout(
			() => {
				if (!$userStore) {
					return;
				}

				const searchParams = new URLSearchParams();
				for (const [key, value] of Object.entries(filterOption)) {
					searchParams.set(key, String(value));
				}
				const url = `${endpoints.suppliers.get}?${searchParams}`;

				suppliersPromise = fetch(url, {
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				})
					.then<Pagination<Supplier[]>>((r) => {
						if (r.ok) {
							return r.json();
						}

						throw 'Đã có lỗi xảy ra';
					})
					.then((pageData) => {
						totalItems = pageData.totalRecords;
						lastestFilterOption = filterOption;

						if (selectedSupplier) {
							const currentSelected = pageData.data.find((x) => x.id === selectedSupplier?.id);
							if (currentSelected) {
								selectedSupplier = currentSelected;
							} else {
								selectedSupplier = undefined;
							}
							resetForm();
						}

						if (resetCurrentPage) {
							currentPage = 1;
						}
						return pageData.data;
					});
			},
			ignoreDelay ? 0 : 400
		);
	}

	function resetForm() {
		$formData.name = selectedSupplier?.name ?? '';
		$formData.email = selectedSupplier?.email ?? '';
		$formData.address = selectedSupplier?.address ?? '';
		$formData.phone = selectedSupplier?.phoneNumber ?? '';
	}
	function deselectAll() {
		selectedSupplier = undefined;
		resetForm();
	}

	function selectType(supplier: Supplier) {
		if (selectedSupplier?.id === supplier.id) {
			deselectAll();
			return;
		}

		selectedSupplier = supplier;
		resetForm();
	}
</script>

<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Danh sách loại nhà cung cấp</h1>
<div class="flex">
	<div class="flex-1">
		<div class="p-1 bg-slate-300 shadow-inner flex gap-1 rounded-lg overflow-hidden">
			<div class="input border-surface-500/25 w-fit overflow-hidden rounded-container-token flex">
				<div class="size-10 flex justify-center items-center border-r border-inherit">
					<i class="fa-solid fa-magnifying-glass"></i>
				</div>
				<input
					type="text"
					maxlength={255}
					placeholder="Nhập tên nhà cung cấp..."
					class="border-none !focus:outline-0 rounded-none"
					bind:value={nameValue}
				/>
			</div>
			<div class="input border-surface-500/25 w-fit overflow-hidden rounded-container-token flex">
				<div class="size-10 flex justify-center items-center border-r border-inherit">
					<i class="fa-solid fa-magnifying-glass"></i>
				</div>
				<input
					type="text"
					maxlength={255}
					placeholder="Nhập số điện thoại..."
					class="border-none !focus:outline-0 rounded-none"
					bind:value={phoneValue}
				/>
			</div>
			<button
				type="button"
				class="btn-icon rounded-container-token variant-filled-tertiary"
				on:click={() => {
					nameValue = '';
					phoneValue = '';
					filtering(nameValue, phoneValue, 1, pageSize, true, false, true);
				}}
			>
				<i class="fa-solid fa-rotate-left"></i>
			</button>
		</div>
		<div class="py-4 flex flex-wrap gap-4">
			{#if suppliersPromise}
				{#await suppliersPromise}
					<Loading class="mx-auto py-6" />
				{:then supplier}
					{#each supplier as supplier (supplier.id)}
						{@const selected = selectedSupplier === supplier}
						<Tooltip.Root openDelay={500}>
							<Tooltip.Trigger asChild let:builder>
								<button
									use:builder.action
									{...builder}
									type="button"
									class="px-4 py-2 border-4 rounded-container-token block text-left {selected
										? 'border-primary-400'
										: ''}"
									on:click={() => selectType(supplier)}
								>
									<p class="font-semibold">{supplier.name}</p>
									<p class="text-sm font-medium text-black/60">{supplier.phoneNumber}</p>
								</button>
							</Tooltip.Trigger>
							<Tooltip.Content
								transition={fly}
								transitionConfig={{
									duration: 200,
									y: 30,
									easing: cubicOut
								}}
								sideOffset={8}
								class="shadow-md text-sm z-20 px-4 py-3 border rounded-md bg-white"
							>
								{supplier.email ?? ''}
								<Tooltip.Arrow class="border-l border-t" />
							</Tooltip.Content>
						</Tooltip.Root>
					{/each}
				{/await}
			{/if}
		</div>
		<CustomPagination
			{totalItems}
			{pageSize}
			bind:currentPage
			on:pageChange={(e) => {
				currentPage = e.detail;
				filtering(nameValue, phoneValue, e.detail, pageSize, true);
			}}
		/>
	</div>
	<div class="flex-shrink-0 pl-4 border-l ml-4">
		<div
			class="rounded-lg h-[51px] font-semibold flex justify-center items-center relative {selectedSupplier
				? 'bg-tertiary-500 text-white'
				: 'bg-slate-300'}"
		>
			{#if selectedSupplier}
				<button
					type="button"
					class="absolute bottom-full right-1 text-sm anchor"
					on:click={deselectAll}
				>
					Trở về tạo nhà cung cấp
				</button>
			{/if}
			{selectedSupplier ? 'Cập nhật loại nhà cung cấp' : 'Tạo loại nhà cung cấp'}
		</div>
		<form method="post" use:enhance class="space-y-4 mt-4">
			<div>
				<Field {form} name="name">
					<Control let:attrs>
						<Label class="text-sm font-semibold text-surface-500 select-none">
							Tên<sup class="text-red-500">*</sup>
						</Label>
						<input
							type="text"
							maxlength={255}
							placeholder="Nhập tên..."
							class="input rounded-md bg-white/70 focus-within:bg-white/100 mt-1"
							{...attrs}
							bind:value={$formData.name}
						/>
						<FieldErrors class="text-sm mt-1" />
					</Control>
				</Field>
			</div>
			<div>
				<Field {form} name="email">
					<Control let:attrs>
						<Label class="text-sm font-semibold text-surface-500 select-none">
							Email<sup class="text-red-500">*</sup>
						</Label>
						<input
							type="text"
							maxlength={255}
							placeholder="Nhập email..."
							class="input rounded-md bg-white/70 focus-within:bg-white/100 mt-1"
							{...attrs}
							bind:value={$formData.email}
						/>
						<FieldErrors class="text-sm mt-1" />
					</Control>
				</Field>
			</div>
			<div>
				<Field {form} name="phone">
					<Control let:attrs>
						<Label class="text-sm font-semibold text-surface-500 select-none">
							Số điện thoại<sup class="text-red-500">*</sup>
						</Label>
						<input
							type="text"
							maxlength={10}
							placeholder="Nhập số điện thoại..."
							class="input rounded-md bg-white/70 focus-within:bg-white/100 mt-1"
							{...attrs}
							bind:value={$formData.phone}
						/>
						<FieldErrors class="text-sm mt-1" />
					</Control>
				</Field>
			</div>
			<div>
				<Field {form} name="address">
					<Control let:attrs>
						<Label class="text-sm font-semibold text-surface-500 select-none">
							Địa chỉ<sup class="text-red-500">*</sup>
						</Label>
						<input
							type="text"
							maxlength={255}
							placeholder="Nhập địa chỉ..."
							class="input rounded-md bg-white/70 focus-within:bg-white/100 mt-1"
							{...attrs}
							bind:value={$formData.address}
						/>
						<FieldErrors class="text-sm mt-1" />
					</Control>
				</Field>
			</div>
			<div class="flex gap-2">
				<button
					type="submit"
					class="btn {selectedSupplier
						? 'variant-filled-tertiary'
						: 'variant-filled-primary'} rounded-container-token flex-1"
				>
					<i class="fa-solid {selectedSupplier ? 'fa-pen-to-square' : 'fa-plus'}"></i>
					<span>{selectedSupplier ? 'Cập nhật' : 'Thêm'}</span>
				</button>
				<button
					type="button"
					class="btn-icon variant-soft-tertiary rounded-container-token"
					on:click={resetForm}
				>
					<i class="fa-solid fa-rotate-left"></i>
				</button>
			</div>
		</form>
	</div>
</div>
