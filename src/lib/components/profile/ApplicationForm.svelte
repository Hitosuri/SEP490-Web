<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getContext, onMount, type ComponentEvents } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import endpoints from '$lib/endpoints';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { type Writable } from 'svelte/store';
	import { handleToastFetch } from '$lib/helpers/utils';
	import { autoHeightTextArea } from '$lib/actions/auto-height-textarea';
	import { createApplicationSchema } from '$lib/form-schemas/create-application-schema';
	import DateRangePicker from '../common/DateRangePicker.svelte';

	export let createApplicationForm: SuperValidated<z.infer<typeof createApplicationSchema>>;
	export let application: Application | undefined = undefined;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const modalStore = getModalStore();
	const form = superForm(createApplicationForm, {
		validators: zodClient(createApplicationSchema),
		resetForm: false,
		SPA: true,
		onUpdate: ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}

			const successMsg = `${application ? 'Cập nhật' : 'Tạo'} đơn nghỉ thành công`;
			const failMsg = `Đã xảy ra lỗi trong quá trình ${application ? 'cập nhật' : 'tạo'} đơn nghỉ`;

			toast.promise(
				handleToastFetch(
					() => {
						const url = application
							? endpoints.application.edit(application.id)
							: endpoints.application.create;
						return fetch(url, {
							method: application ? 'PUT' : 'POST',
							headers: {
								'content-type': 'application/json',
								Authorization: `Bearer ${$userStore.token}`
							},
							body: JSON.stringify(form.data)
						});
					},
					{ success: successMsg },
					() => {
						$modalStore[0]?.response?.(true);
						modalStore.close();
					},
					form
				),
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? successMsg,
					error: (msg) => String(msg ?? '') || failMsg
				}
			);
		}
	});
	const { form: formData, enhance } = form;
	let requesting = false;

	onMount(() => {
		if (!application) {
			return;
		}
		$formData.startAt = application.startAt;
		$formData.endAt = application.endAt;
		$formData.reason = application.reason;
	});

	function onDateChange(e: ComponentEvents<DateRangePicker>['valueChange']) {
		if (e.detail?.[0] && e.detail?.[1]) {
			$formData.startAt = e.detail[0];
			$formData.endAt = e.detail[1];
		}
	}
</script>

<div class="card bg-white p-6 w-full sm:w-5/6 md:w-3/4 lg:w-3/5 xl:w-1/2 2xl:w-[720px]">
	<div class="flex justify-between">
		<div class="text-2xl rounded-md border border-surface-200 size-14 text-center leading-[3.5rem]">
			<i class="fa-regular fa-file"></i>
		</div>
		<button
			class="btn-icon text-2xl !outline-none text-black/60 hover:text-black transition-colors"
			on:click={modalStore.close}
		>
			<i class="fa-solid fa-xmark"></i>
		</button>
	</div>
	<h1 class="font-semibold text-2xl my-6">{application ? 'Sửa' : 'Tạo'} đơn nghỉ</h1>
	<!-- <p class="font-semibold text-surface-400 mb-6">Tạo đơn nghỉ trong một khoảng thời gian</p> -->
	<form use:enhance method="post">
		<fieldset disabled={requesting} class="grid grid-cols-2 gap-4">
			<div class="col-span-2">
				<p class="font-semibold text-surface-500 select-none mb-1">
					Thời gian nghỉ<sup class="text-red-500">*</sup>
				</p>
				<DateRangePicker
					regionInput="!bg-white"
					on:valueChange={onDateChange}
					preventDeselect
					granularity="minute"
					regionContent="z-[999]"
					initValue={application ? [application.startAt, application.endAt] : undefined}
				/>
			</div>
			<div class="col-span-2 flex flex-col">
				<Field {form} name="reason">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none mb-1">
							Lý do<sup class="text-red-500">*</sup>
						</Label>
						<textarea
							class="textarea rounded-md bg-white"
							{...attrs}
							placeholder="Nhập lý do nghỉ..."
							bind:value={$formData.reason}
							use:autoHeightTextArea={{
								minRows: 3,
								value: $formData.reason
							}}
						></textarea>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
		</fieldset>
		<fieldset
			disabled={requesting}
			class="flex gap-4 mt-8 font-medium *:btn *:rounded-container-token *:flex-1"
		>
			<button type="button" class="variant-soft-surface" on:click={modalStore.close}>
				<i class="fa-solid fa-delete-left"></i>
				<span class="pl-1">Huỷ</span>
			</button>
			<button type="submit" class="variant-filled-primary">
				{#if application}
					<i class="fa-solid fa-check"></i>
				{:else}
					<i class="fa-solid fa-plus"></i>
				{/if}
				<span class="pl-1">{application ? 'Cập nhật' : 'Tạo'}</span>
			</button>
		</fieldset>
	</form>
</div>
