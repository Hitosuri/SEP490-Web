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
	import SearchCombobox from '../common/SearchCombobox.svelte';
	import { SlideToggle } from '@skeletonlabs/skeleton';

	export let createMaterialForm: SuperValidated<z.infer<typeof createMaterialSchema>>;
	export let materialTypes: Selected<MaterialType>[];

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const dispatch = createEventDispatcher<{ cancel: undefined; finish: undefined }>();
	const form = superForm(createMaterialForm, {
		validators: zodClient(createMaterialSchema),
		resetForm: false,
		SPA: true,
		onChange: ({ paths, get, set }) => {
			const path = paths[0] ?? '';

			if (path !== 'price' && path !== 'priceForSmallestUnit') {
				return;
			}

			const value = get(path);

			if (!value || (typeof value === 'number' && value < 0)) {
				set(path, 0);
			}
		},
		onUpdate: ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}
			const rielForm: Record<string, string | number | boolean> = { ...form.data };

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
						if (typeof data?.error === 'string') {
							return Promise.reject(data?.error);
						} else if (Array.isArray(data?.error) || Array.isArray(data)) {
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
					return 'Tạo vật tư thành công';
				},
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Tạo vật tư thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình tạo vật tư'
				}
			);
		}
	});
	const { form: formData, enhance } = form;
	let requesting = false;
	let selectedSupplier: Selected<Supplier> | undefined;

	let selectedMaterialType: Selected<MaterialType> | undefined = materialTypes[0];

	$: $formData.supplierId = selectedSupplier?.value.id ?? 0;
	$: $formData.materialTypeId = selectedMaterialType?.value.id ?? 0;
	$: isMedicine =
		selectedMaterialType?.value.code === 'THUOC' || selectedMaterialType?.value.id === 5;

	async function suppilerSearch(input: string): Promise<Selected<Supplier>[] | undefined> {
		if (!$userStore) {
			return;
		}

		const searchParams = new URLSearchParams();
		searchParams.set('page', '1');
		searchParams.set('size', '5');
		searchParams.set('name', input);

		const url = `${endpoints.suppliers.get}?${searchParams}`;
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${$userStore.token}`
			}
		});

		if (!response.ok) {
			return;
		}

		const data: Pagination<Supplier[]> = await response.json();

		return data.data.map((x) => ({
			label: x.name ?? '',
			value: x
		}));
	}
</script>

<div class="card bg-white p-2 pl-4">
	<div class="p-4 overflow-y-scroll max-h-[90vh]">
		<div class="flex justify-between">
			<div
				class="text-2xl rounded-md border border-surface-200 size-14 text-center leading-[3.5rem]"
			>
				<i class="fa-regular fa-capsules"></i>
			</div>
			<slot name="closeBtn" />
		</div>
		<h1 class="font-semibold text-2xl mt-6">Tạo vật tư</h1>
		<p class="font-semibold text-surface-400 mb-6">
			Tạo vật tư được sử dụng cho phòng khám như dụng cụ, thuốc...
		</p>
		<form use:enhance method="post">
			<fieldset disabled={requesting} class="grid grid-cols-2 gap-4">
				<div>
					<Field {form} name="name">
						<Control let:attrs>
							<Label class="font-semibold text-surface-500 select-none">
								Tên vật tư<sup class="text-red-500">*</sup>
							</Label>
							<input
								{...attrs}
								type="text"
								placeholder="Nhập tên vật tư..."
								class="input rounded-container-token mt-1"
								bind:value={$formData.name}
							/>
						</Control>
						<FieldErrors class="text-sm mt-1" />
					</Field>
				</div>
				<div>
					<Field {form} name="supplierId">
						<Control let:attrs>
							<Label class="font-semibold text-surface-500 select-none mb-1">
								Nhà cung cấp<sup class="text-red-500">*</sup>
							</Label>
							<SearchCombobox
								searchFn={suppilerSearch}
								placeholder="Tên nhà cung cấp..."
								bind:selected={selectedSupplier}
								clearable
								let:itemData
							>
								<div>
									<p class={!itemData.label ? 'text-warning-500' : ''}>
										{itemData.label || 'Chưa có tên'}
									</p>
									<p class="text-xs font-medium text-surface-400">
										{itemData.value.email ?? itemData.value.phoneNumber ?? ''}
									</p>
								</div>
							</SearchCombobox>
						</Control>
						<FieldErrors class="text-sm mt-1" />
					</Field>
				</div>
				<div>
					<Field {form} name="materialTypeId">
						<Control let:attrs>
							<Label class="font-semibold text-surface-500 select-none">
								Loại vật tư<sup class="text-red-500">*</sup>
							</Label>
							<DropdownSelect
								items={materialTypes}
								bind:selected={selectedMaterialType}
								regionInput="ring-1 px-3 ring-surface-300 focus:ring-primary justify-between mt-1 w-full"
								let:ValueComponent
							>
								<ValueComponent class="font-semibold" />
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
				{#if isMedicine}
					<div class="col-span-2 border rounded-md p-4 relative space-y-4 bg-slate-100">
						<div class="absolute top-0 left-4 -translate-y-1/2 px-2 bg-white text-sm font-semibold">
							<span>Thông tin bổ sung cho thuốc</span>
							<div class="absolute w-full h-1/2 bg-slate-100 left-0 top-1/2 -z-10"></div>
						</div>
						<div>
							<Field {form} name="dosage">
								<Control let:attrs>
									<Label class="font-semibold text-surface-500 select-none mb-1">
										Liều dùng<sup class="text-red-500">*</sup>
									</Label>
									<textarea
										class="textarea rounded-md bg-white"
										{...attrs}
										rows="3"
										placeholder="Nhập liều dùng..."
										bind:value={$formData.dosage}
									></textarea>
								</Control>
								<FieldErrors class="text-sm" />
							</Field>
						</div>
						<div>
							<Field {form} name="uses">
								<Control let:attrs>
									<Label class="font-semibold text-surface-500 select-none mb-1">
										Cách dùng<sup class="text-red-500">*</sup>
									</Label>
									<textarea
										class="textarea rounded-md bg-white"
										{...attrs}
										rows="3"
										placeholder="Nhập cách dùng..."
										bind:value={$formData.uses}
									></textarea>
								</Control>
								<FieldErrors class="text-sm" />
							</Field>
						</div>
					</div>
				{/if}
				<div>
					<Field {form} name="unit">
						<Control let:attrs>
							<Label class="font-semibold text-surface-500 select-none">
								Đơn vị<sup class="text-red-500">*</sup>
							</Label>
							<input
								{...attrs}
								type="text"
								placeholder="Gói, hộp, l, kg..."
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
					<Field {form} name="smallestUnit">
						<Control let:attrs>
							<Label class="font-semibold text-surface-500 select-none">
								Đơn vị nhỏ nhất<sup class="text-red-500">*</sup>
							</Label>
							<input
								{...attrs}
								type="text"
								placeholder="Viên, gói, ml, g..."
								class="input rounded-container-token mt-1"
								bind:value={$formData.smallestUnit}
							/>
						</Control>
						<FieldErrors class="text-sm mt-1" />
					</Field>
				</div>
				<div>
					<Field {form} name="smallestUnitQuantity">
						<Control let:attrs>
							<Label class="font-semibold text-surface-500 select-none">
								Số lượng đơn vị nhỏ nhất<sup class="text-red-500">*</sup>
							</Label>
							<input
								{...attrs}
								type="number"
								class="input rounded-container-token mt-1"
								bind:value={$formData.smallestUnitQuantity}
							/>
						</Control>
						<FieldErrors class="text-sm mt-1" />
					</Field>
				</div>
				<div>
					<Field {form} name="isSurcharge">
						<Control let:attrs>
							<Label class="font-semibold text-surface-500 select-none mb-2">
								Có phụ phí<sup class="text-red-500"></sup>
							</Label>
							<SlideToggle {...attrs} bind:checked={$formData.isSurcharge} />
						</Control>
						<FieldErrors class="text-sm mt-1" />
					</Field>
				</div>
				{#if $formData.isSurcharge}
					<div>
						<Field {form} name="priceForSmallestUnit">
							<Control let:attrs>
								<Label class="font-semibold text-surface-500 select-none">
									Đơn giá cho đơn vị nhỏ nhất<sup class="text-red-500">*</sup>
								</Label>
								<input
									{...attrs}
									type="number"
									class="input rounded-container-token mt-1"
									bind:value={$formData.priceForSmallestUnit}
								/>
							</Control>
							<FieldErrors class="text-sm mt-1" />
						</Field>
					</div>
				{/if}
				<div class="col-span-2">
					<Field {form} name="description">
						<Control let:attrs>
							<Label class="font-semibold text-surface-500 select-none mb-1">
								Mô tả<sup class="text-red-500">*</sup>
							</Label>
							<textarea
								class="textarea rounded-md bg-white"
								{...attrs}
								rows="3"
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
</div>
