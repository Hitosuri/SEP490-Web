<script lang="ts">
	import { createEventDispatcher, getContext, onMount, type ComponentEvents } from 'svelte';
	import { toast } from 'svelte-sonner';
	import SuperDebug, { setError, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import endpoints from '$lib/endpoints';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { Combobox, type Selected } from 'bits-ui';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { type Writable } from 'svelte/store';
	import { pascalToCamelcase } from '$lib/helpers/utils';
	import { FileDropzone, getModalStore, SlideToggle } from '@skeletonlabs/skeleton';
	import { importMaterialSchema } from '$lib/form-schemas/import-material-schema';
	import DatePicker from '../common/DatePicker.svelte';

	export let importMaterialForm: SuperValidated<z.infer<typeof importMaterialSchema>>;
	export let material: Material;

	const modalStore = getModalStore();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const form = superForm(importMaterialForm, {
		validators: zodClient(importMaterialSchema),
		resetForm: false,
		SPA: true,
		onChange: ({ paths, get, set }) => {
			const path = paths[0] ?? '';

			if (path !== 'inputPrice') {
				return;
			}

			const value = get(path);

			if (!value || (typeof value === 'number' && value < 0)) {
				set('inputPrice', 0);
			}
		},
		onUpdate: ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}

			const { fileSize, ...others } = form.data;
			const formData = new FormData();
			formData.set('csvFile', files![0]);

			Object.entries(others).forEach((x) => {
				if (typeof x[1] === 'string' || typeof x[1] === 'number') {
					formData.set(x[0], String(x[1]));
				}
				if (x[1] instanceof Date) {
					const tmp = new Date(x[1]);
					tmp.setMinutes(tmp.getMinutes() - tmp.getTimezoneOffset());
					formData.set(x[0], tmp.toISOString().split('T')[0]);
				}
			});

			toast.promise(
				async (): Promise<string> => {
					const response = await fetch(endpoints.materials.import.create, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${$userStore.token}`
						},
						body: formData
					});
					const data = await response.json();

					if (!response.ok) {
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
					closeModal(true);
					return 'Nhập vật tư thành công';
				},
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Nhập vật tư thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình nhập vật tư'
				}
			);
		}
	});
	const { form: formData, enhance } = form;
	let requesting = false;
	let files: FileList | undefined;
	let fileInput: HTMLInputElement;

	$: $formData.materialId = material.id;
	$: $formData.fileSize = files?.[0]?.size ?? 0;

	onMount(() => {
		if (fileInput) {
			fileInput.accept = 'text/csv';
		}
	});

	function closeModal(state: boolean = false) {
		$modalStore[0]?.response?.(state);
		modalStore.close();
	}

	function makeAtChanged(e: ComponentEvents<DatePicker>['valueChange']) {
		if (e.detail) {
			$formData.makeAt = e.detail;
		}
	}

	function expireAtChanged(e: ComponentEvents<DatePicker>['valueChange']) {
		if (e.detail) {
			$formData.expiredAt = e.detail;
		}
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
			<button
				class="btn-icon text-2xl !outline-none text-black/60 hover:text-black transition-colors"
				on:click={() => closeModal()}
			>
				<i class="fa-solid fa-xmark"></i>
			</button>
		</div>
		<h1 class="font-semibold text-2xl mt-6">Nhập vật tư</h1>
		<p class="font-medium text-surface-400 mb-6">
			Nhập một số lượng cho vật tư
			<span class="font-bold text-primary-500">{material.name}</span>
		</p>
		<form use:enhance method="post" enctype="multipart/form-data">
			<fieldset disabled={requesting} class="grid grid-cols-2 gap-4 mb-4">
				<div>
					<p class="font-semibold text-surface-500 select-none">Vật tư cần nhập</p>
					<p class="text-xl font-medium tracking-wide text-surface-400 mt-3">
						<span>{material.name}</span>
						<i class="fa-solid fa-lock text-error-500 text-base ml-1"></i>
					</p>
				</div>
				<div>
					<Field {form} name="inputPrice">
						<Control let:attrs>
							<Label class="font-semibold text-surface-500 select-none">
								Giá nhập<sup class="text-red-500">*</sup>
							</Label>
							<input
								{...attrs}
								type="number"
								class="input rounded-container-token mt-1"
								bind:value={$formData.inputPrice}
							/>
						</Control>
						<FieldErrors class="text-sm mt-1" />
					</Field>
				</div>
				<div>
					<Field {form} name="makeAt">
						<Control let:attrs>
							<Label class="font-semibold text-surface-500 select-none mb-1">
								Ngày sản xuất<sup class="text-red-500">*</sup>
							</Label>
							<DatePicker
								preventDeselect
								regionInput="mt-1 w-full"
								regionContent="z-[1000]"
								on:valueChange={makeAtChanged}
							/>
						</Control>
						<FieldErrors class="text-sm mt-1" />
					</Field>
				</div>
				<div>
					<Field {form} name="expiredAt">
						<Control let:attrs>
							<Label class="font-semibold text-surface-500 select-none mb-1">
								Ngày hết hạn<sup class="text-red-500">*</sup>
							</Label>
							<DatePicker
								preventDeselect
								regionInput="mt-1 w-full"
								regionContent="z-[1000]"
								on:valueChange={expireAtChanged}
							/>
						</Control>
						<FieldErrors class="text-sm mt-1" />
					</Field>
				</div>
			</fieldset>
			<div>
				<Field {form} name="fileSize">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none mb-1">
							File<sup class="text-red-500">*</sup>
						</Label>
						{#if files && files[0]}
							<div
								class="border border-surface-500/35 rounded-container-token flex overflow-hidden"
							>
								<div
									class="flex justify-center items-center w-20 flex-shrink-0 bg-slate-100 border-r border-surface-500/35 text-xl"
								>
									<i class="fa-regular fa-file"></i>
								</div>
								<div class="flex-1 px-4 py-3 space-y-1">
									<p class="font-medium tracking-wide">{files[0].name}</p>
									<p class="text-black/50 text-sm font-medium">{files[0].size} bytes</p>
								</div>
								<div>
									<button
										type="button"
										class="btn-icon"
										on:click={() => {
											files = undefined;
										}}
									>
										<i class="fa-solid fa-xmark"></i>
									</button>
								</div>
							</div>
						{:else}
							<FileDropzone
								rounded="rounded-container-token bg-slate-100"
								name="files"
								slotLead="m-0"
								bind:files
								bind:fileInput
							>
								<svelte:fragment slot="message">
									<span class="font-semibold">Tải lên</span>
									hoặc
									<span class="font-semibold">kéo thả</span>
									file
								</svelte:fragment>
							</FileDropzone>
						{/if}
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
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
					<span class="pl-1">Xác nhận nhập</span>
				</button>
			</fieldset>
		</form>
	</div>
</div>
