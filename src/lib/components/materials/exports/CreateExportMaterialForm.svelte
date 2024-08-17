<script lang="ts">
	import endpoints from '$lib/endpoints';
	import { createExportMaterialSchema } from '$lib/form-schemas/create-export-material-schema';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getContext, setContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { derived, type Writable } from 'svelte/store';
	import { setError, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { z } from 'zod';
	import ExportMaterialEditRow from './ExportMaterialEditRow.svelte';
	import { pascalToCamelcase } from '$lib/helpers/utils';

	export let createExportMaterialForm: SuperValidated<z.infer<typeof createExportMaterialSchema>>;

	const modalStore = getModalStore();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	let exportedMaterials: z.infer<typeof createExportMaterialSchema>['exportMaterialRequests'] = [];
	const form = superForm(createExportMaterialForm, {
		validators: zodClient(createExportMaterialSchema),
		resetForm: false,
		SPA: true,
		onUpdate: ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}

			toast.promise(
				async (): Promise<string> => {
					const response = await fetch(endpoints.materials.export.create, {
						method: 'POST',
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
						} else if (typeof data.errors === 'object' || typeof data === 'object') {
							const errorsDict = data.errors ?? data;
							Object.keys(errorsDict).forEach((k) => {
								const fieldName = pascalToCamelcase(k);
								if (Object.keys(form.data).includes(fieldName)) {
									const value = Array.isArray(errorsDict[k]) ? errorsDict[k][0] : errorsDict[k];
									setError(form, fieldName, value);
								}
							});
							return Promise.reject(Object.values(errorsDict).join(', '));
						}

						return Promise.reject();
					}
					$modalStore[0].response?.(true);
					closeModal();
					return 'Tạo phiếu xuất vật tư thành công';
				},
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Tạo phiếu xuất vật tư thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình tạo phiếu xuất vật tư'
				}
			);
		}
	});
	const { form: formData, enhance, errors } = form;
	let materialErrors = derived(errors, (errors) => {
		if (!errors.exportMaterialRequests) {
			return {} as Record<number | string, string[]>;
		}
		return Object.entries(errors.exportMaterialRequests).reduce(
			(c, p) => {
				c[p[0]] = Array.isArray(p[1])
					? [...p[1]]
					: [...(p[1].materialId ?? []), ...(p[1].quantity ?? []), ...(p[1].note ?? [])];
				return c;
			},
			{} as Record<number | string, string[]>
		);
	});
	let requesting = false;

	$: allMaterialId = exportedMaterials.map((x) => x.materialId).filter((x) => x > 0);
	$: $formData.exportMaterialRequests = exportedMaterials;

	setContext('material-errors', materialErrors);

	function closeModal() {
		modalStore.close();
	}

	function removeMaterial(index: number) {
		exportedMaterials = exportedMaterials.filter((_, i) => i !== index);
	}

	function addMaterial() {
		exportedMaterials = [
			...exportedMaterials,
			{
				materialId: 0,
				quantity: 0,
				note: ''
			}
		];
	}
</script>

<div class="card bg-white p-6 w-full sm:w-5/6 md:w-3/4 lg:w-3/5 xl:w-1/2 2xl:w-[720px]">
	<div class="flex justify-between">
		<div class="text-2xl rounded-md border border-surface-200 size-14 text-center leading-[3.5rem]">
			<i class="fa-regular fa-file-export"></i>
		</div>
		<button
			class="btn-icon text-2xl !outline-none text-black/60 hover:text-black transition-colors"
			on:click={closeModal}
		>
			<i class="fa-solid fa-xmark"></i>
		</button>
	</div>
	<h1 class="font-semibold text-2xl mt-6">Tạo phiếu xuất vật tư</h1>
	<p class="font-semibold text-surface-400 mb-6">Phiếu xuất vật tư được sử dụng trong phòng khám</p>
	<form use:enhance method="post">
		<table class="w-full">
			<colgroup>
				<col class="w-10" />
				<col />
				<col class="w-40" />
				<col />
				<col class="w-10" />
			</colgroup>
			<thead>
				<tr class="border-b">
					<th class="">#</th>
					<th class="text-start px-2 py-2">Vật tư</th>
					<th class="px-2 py-2">Số lượng</th>
					<th class="text-start px-2 py-2">Ghi chú</th>
					<th class=""></th>
				</tr>
			</thead>
			<tbody>
				{#each exportedMaterials as material, i (material)}
					<ExportMaterialEditRow
						bind:selectedMaterialId={material.materialId}
						bind:quantity={material.quantity}
						bind:note={material.note}
						index={i}
						excludeIds={allMaterialId}
						on:remove={() => removeMaterial(i)}
					/>
				{:else}
					<tr>
						<td colspan="5" class="border-b py-3">
							<h3 class="h3 font-semibold text-center text-tertiary-500">Danh sách trống</h3>
						</td>
					</tr>
				{/each}
				<tr>
					<td colspan="4" class="py-2">
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
		<fieldset
			disabled={requesting}
			class="grid grid-cols-2 gap-4 mt-8 font-medium *:btn *:rounded-container-token"
		>
			<button type="button" class="variant-soft-surface" on:click={() => closeModal()}>
				<i class="fa-solid fa-delete-left"></i>
				<span class="pl-1">Huỷ</span>
			</button>
			<button type="submit" class="variant-filled-primary">
				<i class="fa-solid fa-plus"></i>
				<span class="pl-1">Tạo</span>
			</button>
		</fieldset>
	</form>
</div>
