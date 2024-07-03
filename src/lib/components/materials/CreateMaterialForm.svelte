<script lang="ts">
	import { createEventDispatcher, getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { setError, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import endpoints from '$lib/endpoints';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { Combobox, type Selected } from 'bits-ui';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { type Writable } from 'svelte/store';
	import { createMaterialSchema } from '$lib/form-schemas/create-material-schema';
	import { pascalToCamelcase } from '$lib/helpers/utils';
	import DropdownSelect from '../common/DropdownSelect.svelte';

	export let createMaterialForm: SuperValidated<z.infer<typeof createMaterialSchema>>;
	export let materialTypes: Selected<MaterialType>[];

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const dispatch = createEventDispatcher<{ cancel: undefined; finish: undefined }>();
	const form = superForm(createMaterialForm, {
		validators: zodClient(createMaterialSchema),
		resetForm: false,
		SPA: true,
		onUpdate: ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}
			const rielForm: Record<string, string | number> = { ...form.data };

			Object.entries(rielForm).forEach((x) => {
				if ((typeof x[1] === 'string' && !x[1].trim()) || (typeof x[1] === 'number' && x[1] <= 0)) {
					delete rielForm[x[0] as string];
				}
			});

			toast.promise(
				async (): Promise<string> => {
					const response = await fetch(endpoints.materials.create, {
						method: 'POST',
						headers: {
							'content-type': 'application/json',
							Authorization: `Bearer ${$userStore.token}`
						},
						body: JSON.stringify(rielForm)
					});
					const data = await response.json();

					if (!response.ok) {
						if (Array.isArray(data?.error) || Array.isArray(data)) {
							const msg = (data?.error ?? data).join(', ');
							return Promise.reject(msg);
						} else if (typeof data.errors === 'object') {
							Object.keys(data.errors).forEach((k) => {
								const fieldName = pascalToCamelcase(k);
								if (Object.keys(form.data).includes(fieldName)) {
									const value = Array.isArray(data.errors[k]) ? data.errors[k][0] : data.errors[k];
									setError(form, fieldName, value);
								}
							});
							return Promise.reject();
						}

						return Promise.reject();
					}
					dispatch('finish');
					return 'Tạo vật liệu thành công';
				},
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Tạo vật liệu thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình tạo vật liệu'
				}
			);
		}
	});
	const { form: formData, enhance } = form;
	let requesting = false;

	let suppliers: Selected<Suppiler>[] = [];
	let supplierSearchInput = '';
	let lastSupplierSearchInput: string;
	let suppilerSearchOpen = false;
	let supplierFirstOpen = false;
	let supplierSearchTimer: NodeJS.Timeout;
	let selectedSupplier: Selected<Suppiler> | undefined;

	let selectedMaterialType: Selected<MaterialType> | undefined = materialTypes[0];

	$: onSupplierSearchOpen(suppilerSearchOpen);
	$: suppilerSearch(supplierSearchInput);
	// $: $formData.supplierId = selectedSupplier?.value.id;
	$: $formData.materialTypeId = selectedMaterialType?.value.id ?? 0;

	function onSupplierSearchOpen(open: boolean) {
		if (!open) {
			return;
		}
		if (supplierFirstOpen) {
			return;
		}

		supplierFirstOpen = true;
		suppilerSearch('');
	}

	function suppilerSearch(input: string) {
		if (!supplierFirstOpen) {
			return;
		}
		const keyword = input.trim();

		if (supplierSearchTimer) {
			clearTimeout(supplierSearchTimer);
		}

		supplierSearchTimer = setTimeout(async () => {
			if (keyword === lastSupplierSearchInput || !$userStore) {
				return;
			}

			const searchParams = new URLSearchParams();
			searchParams.set('page', '1');
			searchParams.set('size', '5');
			searchParams.set('name', keyword);

			const url = `${endpoints.suppliers.get}?${searchParams}`;
			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${$userStore.token}`
				}
			});

			if (!response.ok) {
				return;
			}

			const data: ApiResponse<Suppiler[]> = await response.json();

			lastSupplierSearchInput = keyword;
			suppliers = (data.body ?? []).map((x) => ({
				label: x.name ?? '',
				value: x
			}));
		}, 400);
	}
</script>

<div class="card bg-white p-6">
	<div class="flex justify-between">
		<div class="text-2xl rounded-md border border-surface-200 size-14 text-center leading-[3.5rem]">
			<i class="fa-regular fa-capsules"></i>
		</div>
		<slot name="closeBtn" />
	</div>
	<h1 class="font-semibold text-2xl mt-6">Tạo vật liệu</h1>
	<p class="font-semibold text-surface-400 mb-6">
		Tạo vật liệu được sử dụng cho phòng khám như dụng cụ, thuốc...
	</p>
	<form use:enhance method="post">
		<fieldset disabled={requesting} class="grid grid-cols-2 gap-4">
			<div>
				<Field {form} name="name">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">
							Tên vật liệu<sup class="text-red-500">*</sup>
						</Label>
						<input
							{...attrs}
							type="text"
							class="input rounded-container-token mt-1"
							bind:value={$formData.name}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div>
				<Field {form} name="unit">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">
							Đơn vị<sup class="text-red-500">*</sup>
						</Label>
						<input
							{...attrs}
							type="text"
							class="input rounded-container-token mt-1"
							bind:value={$formData.unit}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div>
				<Field {form} name="price">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">
							Đơn giá<sup class="text-red-500">*</sup>
						</Label>
						<input
							{...attrs}
							type="number"
							class="input rounded-container-token mt-1"
							bind:value={$formData.price}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div>
				<Field {form} name="materialTypeId">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">
							Phân loại<sup class="text-red-500">*</sup>
						</Label>
						<DropdownSelect
							items={materialTypes}
							bind:selected={selectedMaterialType}
							regionInput="ring-1 ring-surface-300 focus:ring-primary- justify-between mt-1 w-full"
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
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div>
				<Field {form} name="supplierId">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">
							Nhà cung cấp<sup class="text-red-500">*</sup>
						</Label>
						<Combobox.Root
							items={suppliers}
							bind:inputValue={supplierSearchInput}
							bind:open={suppilerSearchOpen}
							bind:selected={selectedSupplier}
						>
							<div class="relative mt-1">
								<Combobox.Input
									class="input rounded-md bg-white w-full"
									placeholder="Tên nhà cung cấp..."
									aria-label="Tên nhà cung cấp..."
								/>
								{#if selectedSupplier}
									<button
										type="button"
										class="btn p-2 rounded-md absolute top-[5px] right-1.5 variant-soft-error"
										on:click={() => {
											supplierSearchInput = '';
											selectedSupplier = undefined;
										}}
									>
										<i class="fa-solid fa-circle-xmark"></i>
									</button>
								{/if}
							</div>
							<Combobox.Content
								class="w-full rounded-md border border-surface-100 bg-white p-1 shadow-lg z-[999]"
								transition={fly}
								transitionConfig={{
									duration: 200,
									y: 30,
									easing: cubicOut
								}}
								sideOffset={8}
							>
								{#each suppliers as supplier (supplier.value.email)}
									<Combobox.Item
										class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-2 rounded select-none flex gap-3 items-center cursor-pointer"
										value={supplier.value}
										label={supplier.label}
									>
										<div>
											<p class={!supplier.label ? 'text-warning-500' : ''}>
												{supplier.label || 'Chưa có tên'}
											</p>
											<p class="text-xs font-medium text-surface-400">
												{supplier.value.email ?? supplier.value.phoneNumber ?? ''}
											</p>
										</div>
										<Combobox.ItemIndicator class="ml-auto" asChild={false}>
											<i class="fa-solid fa-check text-primary-500"></i>
										</Combobox.ItemIndicator>
									</Combobox.Item>
								{:else}
									<span class="block px-5 py-2 text-sm text-muted-foreground">
										Không có kết quả
									</span>
								{/each}
							</Combobox.Content>
							<Combobox.HiddenInput name="favoriteFruit" />
						</Combobox.Root>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div class="col-span-2">
				<Field {form} name="description">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none mb-1">
							Mô tả<sup class="text-red-500">*</sup>
						</Label>
						<textarea
							class="textarea rounded-md bg-white"
							{...attrs}
							rows="4"
							placeholder="Nhập mô tả..."
							bind:value={$formData.description}
						></textarea>
					</Control>
					<FieldErrors class="text-sm" />
				</Field>
			</div>
		</fieldset>
		<fieldset
			disabled={requesting}
			class="grid grid-cols-2 gap-4 mt-8 font-medium *:btn *:rounded-container-token"
		>
			<slot name="cancelBtn">
				<span></span>
			</slot>
			<button type="submit" class="variant-filled-primary">
				<i class="fa-solid fa-plus"></i>
				<span class="pl-1">Tạo</span>
			</button>
		</fieldset>
	</form>
</div>
