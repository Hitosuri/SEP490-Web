<script lang="ts">
	import endpoints from '$lib/endpoints';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import EditExportMaterialRowForm from './EditExportMaterialRowForm.svelte';
	import type { z } from 'zod';
	import { editExportMaterialSchema } from '$lib/form-schemas/edit-export-material-schema';
	import { setError, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { pascalToCamelcase } from '$lib/helpers/utils';

	type Assignment = z.infer<
		typeof editExportMaterialSchema
	>['exportMaterialAssignments'][number] & {
		enable: boolean;
	};

	export let exportGroup: ExportGroup;
	export let editExportMaterialForm: SuperValidated<z.infer<typeof editExportMaterialSchema>>;

	const modalStore = getModalStore();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const form = superForm(editExportMaterialForm, {
		validators: zodClient(editExportMaterialSchema),
		resetForm: false,
		SPA: true,
		onUpdate: ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}

			toast.promise(
				async (): Promise<string> => {
					const response = await fetch(endpoints.materials.export.assign, {
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
					return 'Cập nhật phiếu xuất vật tư thành công';
				},
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Cập nhật phiếu xuất vật tư thành công',
					error: (msg) =>
						String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình cập nhật phiếu xuất vật tư'
				}
			);
		}
	});
	const { form: formData, enhance, errors } = form;
	let exportMaterialAssignments: Assignment[] = exportGroup.exportMaterials.map((x) => ({
		exportMaterialId: x.id,
		availableMaterialIds: [],
		enable: true
	}));
	let requesting = false;

	$: $formData.exportMaterialAssignments = exportMaterialAssignments
		.filter((x) => x.enable)
		.map((x) => ({
			exportMaterialId: x.exportMaterialId,
			availableMaterialIds: x.availableMaterialIds
		}));

	onMount(() => {
		$formData.exportMaterialGroup = exportGroup.group;
	});

	function closeModal() {
		modalStore.close();
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
	<h1 class="font-semibold text-2xl mt-6">Gán vật tư cho phiếu xuất</h1>
	<p class="font-semibold text-surface-400 mb-6">Chọn những vật tư cụ thể cho phiếu xuất vật tư</p>
	<form use:enhance method="post" class="space-y-4">
		{#each exportMaterialAssignments as exportMaterial, index (exportMaterial.exportMaterialId)}
			<EditExportMaterialRowForm
				bind:availableIds={exportMaterial.availableMaterialIds}
				material={exportGroup.exportMaterials[index]}
				{index}
			/>
		{/each}
		<fieldset
			disabled={requesting}
			class="grid grid-cols-2 gap-4 mt-8 font-medium *:btn *:rounded-container-token"
		>
			<button type="button" class="variant-soft-surface" on:click={closeModal}>
				<i class="fa-solid fa-delete-left"></i>
				<span class="pl-1">Huỷ</span>
			</button>
			<button
				type="submit"
				class="variant-filled-primary"
				disabled={$formData.exportMaterialAssignments.length == 0}
			>
				<i class="fa-solid fa-check"></i>
				<span class="pl-1">Cập nhật</span>
			</button>
		</fieldset>
	</form>
</div>
