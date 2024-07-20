<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { createEventDispatcher, getContext, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { setError, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import endpoints from '$lib/endpoints';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { formatFullDate } from '$lib/helpers/formatters';
	import { type Writable } from 'svelte/store';
	import { pascalToCamelcase } from '$lib/helpers/utils';
	import { createAppointmentPatientSchema } from '$lib/form-schemas/create-appointment-patient-schema';
	import { autoHeightTextArea } from '$lib/actions/auto-height-textarea';

	export let createAppointmentByPatientForm: SuperValidated<
		z.infer<typeof createAppointmentPatientSchema>
	>;
	export let startHour: number;
	export let startMinute: number;
	export let date: Date;
	export let doctor: UserMinimal;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const modalStore = getModalStore();
	const dispatch = createEventDispatcher<{ cancel: undefined; finish: undefined }>();
	const form = superForm(createAppointmentByPatientForm, {
		validators: zodClient(createAppointmentPatientSchema),
		resetForm: false,
		SPA: true,
		onUpdate: ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}

			toast.promise(
				async (): Promise<string> => {
					const response = await fetch(endpoints.schedule.createByPatient, {
						method: 'POST',
						headers: {
							'content-type': 'application/json',
							Authorization: `Bearer ${$userStore.token}`
						},
						body: JSON.stringify(form.data)
					});
					const data = await response.json();

					if (!response.ok) {
						if (Array.isArray(data?.error) || Array.isArray(data)) {
							const msg = (data?.error ?? data).join(', ');
							return Promise.reject(msg);
						} else if (typeof data === 'object') {
							Object.keys(data).forEach((k) => {
								const fieldName = pascalToCamelcase(k);
								if (Object.keys(form.data).includes(fieldName)) {
									setError(form, fieldName, data[k]);
								}
							});
							return Promise.reject();
						}

						return Promise.reject();
					}
					dispatch('finish');
					closeModal();
					return 'Tạo lịch hẹn thành công';
				},
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Tạo lịch hẹn thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình tạo lịch hẹn'
				}
			);
		}
	});
	const { form: formData, enhance, allErrors } = form;
	let requesting = false;

	$: startTime = new Date(date);
	$: startTime.setHours(startHour);
	$: startTime.setMinutes(startMinute);
	$: $formData.doctorId = doctor.id;
	$: $formData.startAt = startTime;

	function closeModal() {
		$modalStore[0]?.response?.(true);
		modalStore.close();
	}
</script>

<div class="card bg-white p-6 w-full sm:w-5/6 md:w-3/4 lg:w-3/5 xl:w-1/2 2xl:w-[720px]">
	<div class="flex justify-between">
		<div class="text-2xl rounded-md border border-surface-200 size-14 text-center leading-[3.5rem]">
			<i class="fa-regular fa-calendar-lines-pen"></i>
		</div>
		<button
			class="btn-icon text-2xl !outline-none text-black/60 hover:text-black transition-colors"
			on:click={closeModal}
		>
			<i class="fa-solid fa-xmark"></i>
		</button>
	</div>
	<h1 class="font-semibold text-2xl my-6">Tạo lịch hẹn</h1>
	<form use:enhance method="post">
		<fieldset disabled={requesting} class="space-y-4">
			<div>
				<p class="font-semibold text-surface-500 select-none mb-1">Thời gian hẹn</p>
				<div
					class="text-xl font-semibold tracking-wide h-[42px] leading-[42px] text-primary-600 pl-4"
				>
					<span>
						{startHour}:{String(startMinute).padStart(2, '0')}
					</span>
					<span class="px-4">-</span>
					<span>
						{formatFullDate(date)}
					</span>
				</div>
			</div>
			<div>
				<p class="font-semibold text-surface-500 select-none mb-1">Khám với bác sĩ</p>
				<div
					class="text-xl font-semibold tracking-wide h-[42px] leading-[42px] text-primary-600 pl-4"
				>
					{doctor.name}
				</div>
			</div>
			<div class="col-span-2 flex flex-col">
				<Field {form} name="description">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none mb-1">Mô tả</Label>
						<textarea
							class="textarea rounded-md bg-white"
							{...attrs}
							placeholder="Nhập mô tả, triệu chứng..."
							bind:value={$formData.description}
							use:autoHeightTextArea={{
								minRows: 3,
								value: $formData.description
							}}
						></textarea>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
		</fieldset>
		<!-- <div>
			{#each $allErrors as error}
				<p>{error.messages.join(', ')}</p>
			{/each}
		</div> -->
		<fieldset
			disabled={requesting}
			class="flex gap-4 mt-8 font-medium *:btn *:rounded-container-token *:flex-1"
		>
			<button type="button" class="variant-soft-surface" on:click={closeModal}>
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
