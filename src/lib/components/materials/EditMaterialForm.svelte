<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { setError, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import endpoints from '$lib/endpoints';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { type Selected } from 'bits-ui';
	import { type Writable } from 'svelte/store';
	import { createMaterialSchema } from '$lib/form-schemas/create-material-schema';
	import { handleToastFetch, pascalToCamelcase } from '$lib/helpers/utils';
	import DropdownSelect from '../common/DropdownSelect.svelte';
	import SearchCombobox from '../common/SearchCombobox.svelte';
	import { getModalStore, SlideToggle } from '@skeletonlabs/skeleton';
	import Loading from '../common/Loading.svelte';
	import { browser } from '$app/environment';

	export let editMaterialForm: SuperValidated<z.infer<typeof createMaterialSchema>>;
	export let materialTypes: Selected<MaterialType>[];
	export let material: Material;

	const modalStore = getModalStore();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const materialTypesForEditing: Selected<MaterialType>[] = [
		{
			label: 'Chưa chọn',
			value: {
				id: 0,
				name: 'Chưa chọn',
				code: ''
			}
		},
		...materialTypes.slice(1)
	];
	const form = superForm(editMaterialForm, {
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
			const rielForm: Record<string, string | number | boolean | null> = { ...form.data };

			Object.entries(rielForm).forEach((x) => {
				if ((typeof x[1] === 'string' && !x[1].trim()) || (typeof x[1] === 'number' && x[1] <= 0)) {
					delete rielForm[x[0] as string];
				}
			});

			toast.promise(
				handleToastFetch(
					fetch(endpoints.materials.edit(material.id), {
						method: 'PUT',
						headers: {
							'content-type': 'application/json',
							Authorization: `Bearer ${$userStore.token}`
						},
						body: JSON.stringify(rielForm)
					}),
					{ success: 'Cập nhật vật tư thành công' },
					() => closeModal(true),
					form
				),
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Cập nhật vật tư thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình cập nhật vật tư'
				}
			);
		}
	});
	const { form: formData, enhance } = form;
	let requesting = false;
	let selectedSupplier: Selected<Supplier> | undefined;
	let selectedMaterialType: Selected<MaterialType> | undefined = undefined;
	let loadStatus: 'init' | 'loading' | 'fail' | 'success' = 'init';

	$: $formData.supplierId = selectedSupplier?.value.id ?? 0;
	$: $formData.materialTypeId = selectedMaterialType?.value.id ?? 0;
	$: isMedicine =
		selectedMaterialType?.value.code === 'THUOC' || selectedMaterialType?.value.id === 5;

	onMount(() => {
		if (browser) {
			loadDefaultMaterial();
		}
	});

	function closeModal(state: boolean = false) {
		$modalStore[0]?.response?.(state);
		modalStore.close();
	}

	async function loadDefaultMaterial() {
		if (!$userStore) {
			loadStatus = 'fail';
			return;
		}
		loadStatus = 'loading';

		try {
			const r = await fetch(endpoints.materials.detail(material.id), {
				headers: {
					Authorization: `Bearer ${$userStore.token}`
				}
			});

			if (!r.ok) {
				loadStatus = 'fail';
				return;
			}

			const data: ApiResponse<MaterialDetail> = await r.json();

			if (!data.body) {
				loadStatus = 'fail';
				return;
			}

			$formData.name = data.body.name;
			$formData.unit = data.body.unit;
			$formData.price = data.body.price;
			$formData.isSurcharge = data.body.isSurcharge;
			$formData.smallestUnit = data.body.smallestUnit ?? '';
			$formData.priceForSmallestUnit = data.body.priceForSmallestUnit;
			$formData.smallestUnitQuantity = data.body.smallestUnitQuantity ?? 0;
			$formData.description = data.body.description;
			$formData.dosage = data.body.dosage;
			$formData.uses = data.body.uses;

			selectedMaterialType = materialTypesForEditing.find(
				(x) => x.value.id === data.body?.materialTypeId
			);
			if (data.body.supplierId) {
				selectedSupplier = {
					label: data.body.supplierName,
					value: {
						id: data.body.supplierId,
						address: '',
						email: '',
						name: data.body.supplierName,
						phoneNumber: ''
					}
				};
			}

			loadStatus = 'success';
		} catch {
			loadStatus = 'fail';
		}
	}

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

<div class="card bg-white w-full sm:w-5/6 md:w-3/4 lg:w-3/5 xl:w-1/2 2xl:w-[720px] p-2 pl-4">
	{#if loadStatus === 'init'}
		<span>-</span>
	{:else if loadStatus === 'fail'}
		<button
			type="button"
			class="btn variant-filled-error rounded-container-token block mx-auto"
			on:click={() => loadDefaultMaterial()}
		>
			<i class="fa-solid fa-rotate"></i>
			<span>Tải lại</span>
		</button>
	{:else if loadStatus === 'loading'}
		<Loading class="w-full justify-center items-center h-[42px]" />
	{:else if loadStatus === 'success'}
		<div class="p-4 overflow-y-scroll max-h-[90vh]">
			<div class="flex justify-between">
				<div
					class="text-2xl rounded-md border border-surface-200 size-14 text-center leading-[3.5rem]"
				>
					<i class="fa-regular fa-capsules"></i>
				</div>
				<button
					class="btn-icon text-2xl !outline-none text-black/60 hover:text-black transition-colors"
					on:click={() => closeModal()}
				>
					<i class="fa-solid fa-xmark"></i>
				</button>
			</div>
			<h1 class="font-semibold text-2xl mt-6">Sửa vật tư</h1>
			<p class="font-semibold text-surface-400 mb-6">
				Sửa thông tin vật tư được sử dụng cho phòng khám...
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
									maxlength={255}
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
									items={materialTypesForEditing}
									bind:selected={selectedMaterialType}
									regionInput="ring-1 px-3 ring-surface-300 focus:ring-primary justify-between mt-1 w-full"
									regionContent="z-[1000]"
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
							<div
								class="absolute top-0 left-4 -translate-y-1/2 px-2 bg-white text-sm font-semibold"
							>
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
											maxlength={255}
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
											maxlength={255}
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
									maxlength={20}
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
									maxlength={20}
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
									maxlength={255}
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
					<button type="button" class="variant-soft-surface" on:click={() => closeModal()}>
						<i class="fa-solid fa-delete-left"></i>
						<span class="pl-1">Huỷ</span>
					</button>
					<button type="submit" class="variant-filled-primary">
						<i class="fa-solid fa-check"></i>
						<span class="pl-1">Cập nhật</span>
					</button>
				</fieldset>
			</form>
		</div>
	{/if}
</div>
