<script lang="ts">
	import endpoints from '$lib/endpoints';
	import { createTreatmentSchema } from '$lib/form-schemas/create-treatment-schema';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { getContext, onMount, setContext } from 'svelte';
	import { derived, type Writable } from 'svelte/store';
	import { setError, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { z } from 'zod';
	import { toast } from 'svelte-sonner';
	import { pascalToCamelcase } from '$lib/helpers/utils';
	import Loading from '$lib/components/common/Loading.svelte';
	import ExtraMaterialEditRow from '$lib/components/records/ExtraMaterialEditRow.svelte';
	import { browser } from '$app/environment';

	export let editTreatmentForm: SuperValidated<z.infer<typeof createTreatmentSchema>>;
	export let treatment: Treatment;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const modalStore = getModalStore();
	const form = superForm(editTreatmentForm, {
		validators: zodClient(createTreatmentSchema),
		resetForm: false,
		SPA: true,
		onUpdate: ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}

			toast.promise(
				async (): Promise<string> => {
					const response = await fetch(endpoints.treatments.edit(treatment.id), {
						method: 'PUT',
						headers: {
							'content-type': 'application/json',
							Authorization: `Bearer ${$userStore.token}`
						},
						body: JSON.stringify(form.data)
					});

					if (!response.ok) {
						const data = await response.json();
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
					closeModal(true);
					return 'Cập nhật dịch vụ thành công';
				},
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Cập nhật dịch vụ thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình cập nhật dịch vụ'
				}
			);
		}
	});
	const { form: formData, enhance, errors } = form;
	let requesting = false;
	let usedMaterials: z.infer<typeof createTreatmentSchema>['materials'] = [
		...treatment.materials.map((x) => ({
			materialId: x.materialId,
			quantity: x.quantity,
			isBasicUnit: x.isBasicUnit
		}))
	];
	let loadStatus: 'init' | 'loading' | 'fail' | 'success' =
		treatment.materials.length > 0 ? 'init' : 'success';
	let extraMaterials: Material[] = [];
	let materialErrors = derived(errors, (errors) => {
		if (!errors.materials) {
			return {} as Record<number | string, string[]>;
		}
		return Object.entries(errors.materials).reduce(
			(c, p) => {
				c[p[0]] = Array.isArray(p[1])
					? [...p[1]]
					: [...(p[1].materialId ?? []), ...(p[1].quantity ?? []), ...(p[1].isBasicUnit ?? [])];
				return c;
			},
			{} as Record<number | string, string[]>
		);
	});

	$: allMaterialId = usedMaterials.map((x) => x.materialId).filter((x) => x > 0);
	$: $formData.materials = [...usedMaterials];
	$: $formData.name = treatment.name;
	$: $formData.price = treatment.price;

	setContext('material-errors', materialErrors);
	onMount(() => {
		if (browser && treatment.materials.length > 0) {
			loadDefaultMaterial();
		}
	});

	async function loadDefaultMaterial() {
		if (!$userStore) {
			loadStatus = 'fail';
			return;
		}
		loadStatus = 'loading';
		const searchParams = new URLSearchParams();
		searchParams.set('page', '1');
		searchParams.set('size', String(treatment.materials.length));
		treatment.materials.forEach((x) => {
			searchParams.append('includeIds', String(x.materialId));
		});

		try {
			const r = await fetch(`${endpoints.materials.get}?${searchParams}`, {
				headers: {
					Authorization: `Bearer ${$userStore.token}`
				}
			});

			if (!r.ok) {
				loadStatus = 'fail';
				return;
			}

			const data: Pagination<Material[]> = await r.json();
			console.log(data.data.length, treatment.materials.length);

			if (data.data.length !== treatment.materials.length) {
				loadStatus = 'fail';
				return;
			}

			extraMaterials = data.data;

			loadStatus = 'success';
		} catch {
			loadStatus = 'fail';
			return;
		}
	}

	function closeModal(state: boolean = false) {
		$modalStore[0]?.response?.(state);
		modalStore.close();
	}

	function addMaterial() {
		usedMaterials = [
			...usedMaterials,
			{
				materialId: 0,
				quantity: 0,
				isBasicUnit: true
			}
		];
	}

	function removeMaterial(index: number) {
		usedMaterials = usedMaterials.filter((_, i) => i !== index);
	}
</script>

<div class="card bg-white p-6 w-full sm:w-5/6 md:w-3/4 lg:w-3/5 xl:w-1/2 2xl:w-[720px]">
	<div class="flex justify-between">
		<div class="text-2xl rounded-md border border-surface-200 size-14 text-center leading-[3.5rem]">
			<i class="fa-regular fa-teeth"></i>
		</div>
		<button
			class="btn-icon text-2xl !outline-none text-black/60 hover:text-black transition-colors"
			on:click={() => closeModal()}
		>
			<i class="fa-solid fa-xmark"></i>
		</button>
	</div>
	<h1 class="font-semibold text-2xl mt-6">Sửa dịch vụ</h1>
	<p class="font-semibold text-surface-400 mb-6">Các dịch vụ được cung cấp bởi phòng khám</p>
	<form use:enhance method="post">
		<fieldset disabled={requesting} class="grid grid-cols-2 gap-4">
			<div>
				<Field {form} name="name">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">
							Tên dịch vụ<sup class="text-red-500">*</sup>
						</Label>
						<input
							{...attrs}
							type="text"
							placeholder="Nhập tên dịch vụ..."
							class="input rounded-container-token mt-1"
							bind:value={$formData.name}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div>
				<Field {form} name="price">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">
							Giá<sup class="text-red-500">*</sup>
						</Label>
						<input
							{...attrs}
							type="number"
							placeholder="Nhập giá dịch vụ..."
							class="input rounded-container-token mt-1"
							bind:value={$formData.price}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div class="col-span-2">
				<p class="font-semibold text-surface-500 select-none">Vật tư được sử dụng</p>
				<table class="w-full">
					<colgroup>
						<col class="w-10" />
						<col />
						<col />
						<col class="w-40" />
						<col class="w-10" />
					</colgroup>
					<thead>
						<tr class="border-b">
							<th class="">#</th>
							<th class="text-start px-2 py-2">Vật tư</th>
							<th class="px-2 py-2">Đơn vị</th>
							<th class="text-end px-2 py-2">Số lượng</th>
							<th class=""></th>
						</tr>
					</thead>
					<tbody>
						{#if loadStatus === 'init'}
							<tr>
								<td colspan="5" class="p-2">-</td>
							</tr>
						{:else if loadStatus === 'fail'}
							<tr>
								<td colspan="5" class="p-2">
									<button
										type="button"
										class="btn variant-filled-error rounded-container-token block mx-auto"
										on:click={() => loadDefaultMaterial()}
									>
										<i class="fa-solid fa-rotate"></i>
										<span>Tải lại</span>
									</button>
								</td>
							</tr>
						{:else if loadStatus === 'loading'}
							<tr>
								<td colspan="5" class="p-2">
									<Loading class="w-full justify-center items-center h-[42px]" />
								</td>
							</tr>
						{:else if loadStatus === 'success'}
							{#each usedMaterials as material, i (material)}
								{@const foundInExtra = extraMaterials.find((x) => x.id === material.materialId)}
								{@const foundInExtra2 = foundInExtra
									? treatment.materials.find((x) => x.materialId === material.materialId)
									: undefined}
								{#if foundInExtra && foundInExtra2}
									<ExtraMaterialEditRow
										bind:selectedMaterialId={material.materialId}
										bind:quantity={material.quantity}
										bind:isBasicUnit={material.isBasicUnit}
										index={i}
										excludeIds={allMaterialId}
										initMaterial={foundInExtra}
										initUnit={foundInExtra2.isBasicUnit}
										initQuantity={foundInExtra2.quantity}
										on:remove={() => removeMaterial(i)}
									/>
								{:else}
									<ExtraMaterialEditRow
										bind:selectedMaterialId={material.materialId}
										bind:quantity={material.quantity}
										bind:isBasicUnit={material.isBasicUnit}
										index={i}
										excludeIds={allMaterialId}
										on:remove={() => removeMaterial(i)}
									/>
								{/if}
							{:else}
								<tr>
									<td colspan="5" class="border-b py-3">
										<h3 class="h3 font-semibold text-center text-tertiary-500">Danh sách trống</h3>
									</td>
								</tr>
							{/each}
						{/if}
						<tr>
							<td colspan="5" class="py-2">
								<div class="w-10">
									<button
										type="button"
										class="btn-icon btn-icon-sm rounded-container-token variant-filled-primary block mx-auto"
										on:click={addMaterial}
									>
										<i class="fa-solid fa-plus"></i>
									</button>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
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
