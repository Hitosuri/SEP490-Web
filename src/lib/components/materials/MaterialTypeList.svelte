<script lang="ts">
	import { autoHeightTextArea } from '$lib/actions/auto-height-textarea';
	import { materialTypeCreateSchema } from '$lib/form-schemas/material-type-create-schema';
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
	import { pascalToCamelcase } from '$lib/helpers/utils';

	export let materialTypeCreateForm: SuperValidated<z.infer<typeof materialTypeCreateSchema>>;
	export function onTabActive() {
		if (firstActive) {
			return;
		}

		firstActive = true;
		filtering('', '', currentPage, pageSize, true, true, true);
	}

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const form = superForm(materialTypeCreateForm, {
		SPA: true,
		invalidateAll: false,
		resetForm: false,
		validators: zodClient(materialTypeCreateSchema),
		onUpdate: ({ form }) => {
			if (!$userStore || !form.valid) {
				return;
			}

			toast.promise(
				async (): Promise<string> => {
					const url = selectedMaterialType
						? endpoints.materialTypes.edit(selectedMaterialType.id)
						: endpoints.materialTypes.create;
					const response = await fetch(url, {
						method: selectedMaterialType ? 'PUT' : 'POST',
						headers: {
							'content-type': 'application/json',
							Authorization: `Bearer ${$userStore.token}`
						},
						body: JSON.stringify(form.data)
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

					filtering(nameValue, codeValue, currentPage, pageSize, true, true);

					return selectedMaterialType
						? 'Cập nhật loại vật tư thành công'
						: 'Tạo loại vật tư thành công';
				},
				{
					loading: 'Đang xử lý...',
					success: (msg) =>
						msg ?? selectedMaterialType
							? 'Cập nhật loại vật tư thành công'
							: 'Tạo loại vật tư thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi'
				}
			);
		}
	});
	const { form: formData, enhance } = form;
	let nameValue = '';
	let codeValue = '';
	let filterTimer: NodeJS.Timeout | undefined;
	let currentPage = 1;
	let totalItems = 0;
	let pageSize = 20;
	let materialTypesPromise: Promise<MaterialType[]> | undefined;
	let lastestFilterOption: Record<string, string> = {};
	let firstActive = false;
	let selectedMaterialType: MaterialType | undefined;

	$: if (firstActive) {
		filtering(nameValue, codeValue, 1, pageSize, false, false, true);
	}

	function filtering(
		name: string,
		code: string,
		page: number,
		size: number,
		ignoreDelay: boolean = false,
		forceFilter: boolean = false,
		resetCurrentPage: boolean = false
	) {
		name = name.trim();
		code = code.trim();

		if (filterTimer) {
			clearTimeout(filterTimer);
			filterTimer = undefined;
		}

		filterTimer = setTimeout(
			() => {
				if (!$userStore) {
					return;
				}

				const filterOption: Record<string, string> = {
					page: String(page),
					size: String(size),
					materialTypeName: name,
					code
				};

				if (!forceFilter && isEqual(lastestFilterOption, filterOption)) {
					return;
				}

				const searchParams = new URLSearchParams();
				for (const [key, value] of Object.entries(filterOption)) {
					searchParams.set(key, String(value));
				}
				const url = `${endpoints.materialTypes.get}?${searchParams}`;

				materialTypesPromise = fetch(url, {
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				})
					.then<Pagination<MaterialType[]>>((r) => {
						if (r.ok) {
							return r.json();
						}

						throw 'Đã có lỗi xảy ra';
					})
					.then((pageData) => {
						totalItems = pageData.totalRecords;
						lastestFilterOption = filterOption;

						if (selectedMaterialType) {
							const currentSelected = pageData.data.find((x) => x.id === selectedMaterialType?.id);
							if (currentSelected) {
								selectedMaterialType = currentSelected;
							} else {
								selectedMaterialType = undefined;
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
		$formData.name = selectedMaterialType?.name ?? '';
		$formData.code = selectedMaterialType?.code ?? '';
		$formData.description = selectedMaterialType?.description ?? '';
	}

	function deselectAll() {
		selectedMaterialType = undefined;
		resetForm();
	}

	function selectType(materialType: MaterialType) {
		if (selectedMaterialType?.id === materialType.id) {
			deselectAll();
			return;
		}

		selectedMaterialType = materialType;
		resetForm();
	}
</script>

<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Danh sách loại vật tư</h1>
<div class="flex">
	<div class="flex-1">
		<div class="p-1 bg-slate-300 shadow-inner flex gap-1 rounded-lg overflow-hidden">
			<div class="input border-surface-500/25 w-fit overflow-hidden rounded-container-token flex">
				<div class="size-10 flex justify-center items-center border-r border-inherit">
					<i class="fa-solid fa-magnifying-glass"></i>
				</div>
				<input
					type="text"
					placeholder="Nhập tên loại vật tư..."
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
					placeholder="Nhập mã loại vật tư..."
					class="border-none !focus:outline-0 rounded-none"
					bind:value={codeValue}
				/>
			</div>
			<button
				type="button"
				class="btn-icon rounded-container-token variant-filled-tertiary"
				on:click={() => {
					nameValue = '';
					codeValue = '';
					filtering(nameValue, codeValue, 1, pageSize, true, false, true);
				}}
			>
				<i class="fa-solid fa-rotate-left"></i>
			</button>
		</div>
		<div class="py-4 flex flex-wrap gap-4">
			{#if materialTypesPromise}
				{#await materialTypesPromise}
					<Loading class="mx-auto py-6" />
				{:then materialTypes}
					{#each materialTypes as type (type.id)}
						{@const selected = selectedMaterialType === type}
						<Tooltip.Root openDelay={500}>
							<Tooltip.Trigger asChild let:builder>
								<button
									use:builder.action
									{...builder}
									type="button"
									class="px-4 py-2 border-4 rounded-container-token block text-left {selected
										? 'border-primary-400'
										: ''}"
									on:click={() => selectType(type)}
								>
									<p class="font-semibold">{type.name}</p>
									<p class="text-sm font-medium text-black/70">#{type.code}</p>
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
								{type.description ?? ''}
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
				filtering(nameValue, codeValue, e.detail, pageSize, true);
			}}
		/>
	</div>
	<div class="flex-shrink-0 pl-4 border-l ml-4">
		<div
			class="rounded-lg h-[51px] font-semibold flex justify-center items-center relative {selectedMaterialType
				? 'bg-tertiary-500 text-white'
				: 'bg-slate-300'}"
		>
			{#if selectedMaterialType}
				<button
					type="button"
					class="absolute bottom-full right-0 text-sm anchor"
					on:click={deselectAll}
				>
					Trở về tạo loại vật tư
				</button>
			{/if}
			{selectedMaterialType ? 'Cập nhật loại vật tư' : 'Tạo loại vật tư'}
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
				<Field {form} name="code">
					<Control let:attrs>
						<Label class="text-sm font-semibold text-surface-500 select-none">
							Mã<sup class="text-red-500">*</sup>
						</Label>
						<input
							type="text"
							placeholder="Nhập mã..."
							class="input rounded-md bg-white/70 focus-within:bg-white/100 mt-1"
							{...attrs}
							bind:value={$formData.code}
						/>
						<FieldErrors class="text-sm mt-1" />
					</Control>
				</Field>
			</div>
			<div class="flex flex-col">
				<Field {form} name="description">
					<Control let:attrs>
						<Label class="text-sm font-semibold text-surface-500 select-none mb-1">Mô tả</Label>
						<textarea
							{...attrs}
							bind:value={$formData.description}
							placeholder="Nhập mô tả..."
							class="textarea bg-white border-surface-500/35"
							use:autoHeightTextArea={{
								value: $formData.description,
								minRows: 2
							}}
						></textarea>
						<FieldErrors class="text-sm mt-1" />
					</Control>
				</Field>
			</div>
			<div class="flex gap-2">
				<button
					type="submit"
					class="btn {selectedMaterialType
						? 'variant-filled-tertiary'
						: 'variant-filled-primary'} rounded-container-token flex-1"
				>
					<i class="fa-solid {selectedMaterialType ? 'fa-pen-to-square' : 'fa-plus'}"></i>
					<span>{selectedMaterialType ? 'Cập nhật' : 'Thêm'}</span>
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
