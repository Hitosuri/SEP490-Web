<script lang="ts">
	import { getModalStore, SlideToggle } from '@skeletonlabs/skeleton';
	import { createEventDispatcher, getContext, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { setError, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import endpoints from '$lib/endpoints';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { formatCompactDate, formatFullDate } from '$lib/helpers/formatters';
	import { type Writable } from 'svelte/store';
	import { handleToastFetch, pascalToCamelcase } from '$lib/helpers/utils';
	import { createAppointmentPatientSchema } from '$lib/form-schemas/create-appointment-patient-schema';
	import { autoHeightTextArea } from '$lib/actions/auto-height-textarea';
	import NumberInput from '$lib/components/common/NumberInput.svelte';

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
				handleToastFetch(
					fetch(endpoints.schedule.createByPatient, {
						method: 'POST',
						headers: {
							'content-type': 'application/json',
							Authorization: `Bearer ${$userStore.token}`
						},
						body: JSON.stringify(form.data)
					}),
					{ success: 'Tạo lịch hẹn thành công' },
					() => {
						dispatch('finish');
						closeModal();
					},
					form
				),
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Tạo lịch hẹn thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình tạo lịch hẹn'
				}
			);
		}
	});
	const { form: formData, enhance } = form;
	let requesting = false;
	let anotherPatient: Exclude<
		z.infer<typeof createAppointmentPatientSchema>['scheduleForAnotherRequest'],
		undefined
	> = {
		createForPatientAge: 0,
		createForPatientName: '',
		noteForPatientCreatedBy: '',
		relationWithCurrentPatient: ''
	};
	let createForAnother = false;

	$: startTime = new Date(date);
	$: startTime.setHours(startHour);
	$: startTime.setMinutes(startMinute);
	$: $formData.doctorId = doctor.id;
	$: $formData.startAt = startTime;
	$: $formData.scheduleForAnotherRequest = createForAnother ? anotherPatient : undefined;

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
			<div class="grid grid-cols-2">
				<div>
					<p class="font-semibold text-surface-500 select-none mb-1">Thời gian hẹn</p>
					<div
						class="text-xl font-semibold tracking-wide h-[42px] leading-[42px] text-primary-600 pl-4"
					>
						{startHour}:{String(startMinute).padStart(2, '0')}
						-
						{formatCompactDate(date)}
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
			</div>
			<div class="col-span-2 flex flex-col">
				<Field {form} name="description">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none mb-1">
							Mô tả<sup class="text-red-500">*</sup>
						</Label>
						<textarea
							class="textarea rounded-md bg-white"
							{...attrs}
							placeholder="Nhập mô tả, triệu chứng..."
							bind:value={$formData.description}
							use:autoHeightTextArea={{
								minRows: 2,
								value: $formData.description
							}}
						></textarea>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div class="flex gap-4 items-center col-span-2">
				<span class="font-semibold text-surface-500 select-none">Tạo lịch hộ bệnh nhân khác</span>
				<SlideToggle size="sm" name="create-for-another" bind:checked={createForAnother} />
			</div>
			{#if createForAnother}
				<div class="grid grid-cols-2 gap-4 col-span-2 border rounded-md p-4 relative bg-slate-50">
					<div>
						<Field {form} name="scheduleForAnotherRequest.createForPatientName">
							<Control let:attrs>
								<Label class="font-semibold text-surface-500 select-none mb-1">
									Tên bệnh nhân<sup class="text-red-500">*</sup>
								</Label>
								<input
									{...attrs}
									type="text"
									placeholder="Nhập tên bệnh nhân..."
									class="input rounded-container-token bg-white/100"
									bind:value={anotherPatient.createForPatientName}
								/>
							</Control>
							<FieldErrors class="text-sm mt-1" />
						</Field>
					</div>
					<div>
						<Field {form} name="scheduleForAnotherRequest.createForPatientAge">
							<Control let:attrs>
								<Label class="font-semibold text-surface-500 select-none mb-1">
									Tuổi bệnh nhân<sup class="text-red-500">*</sup>
								</Label>
								<NumberInput bind:value={anotherPatient.createForPatientAge} />
							</Control>
							<FieldErrors class="text-sm mt-1" />
						</Field>
					</div>
					<div>
						<Field {form} name="scheduleForAnotherRequest.noteForPatientCreatedBy">
							<Control let:attrs>
								<Label class="font-semibold text-surface-500 select-none mb-1">
									Ghi chú cho người giám hộ
								</Label>
								<input
									{...attrs}
									type="text"
									placeholder="Nhập ghi chú..."
									class="input rounded-container-token bg-white/100"
									bind:value={anotherPatient.noteForPatientCreatedBy}
								/>
							</Control>
							<FieldErrors class="text-sm mt-1" />
						</Field>
					</div>
					<div>
						<Field {form} name="scheduleForAnotherRequest.relationWithCurrentPatient">
							<Control let:attrs>
								<Label class="font-semibold text-surface-500 select-none mb-1">
									Quan hệ với giám hộ<sup class="text-red-500">*</sup>
								</Label>
								<input
									{...attrs}
									type="text"
									placeholder="Bố, mẹ, ông, bà..."
									class="input rounded-container-token bg-white/100"
									bind:value={anotherPatient.relationWithCurrentPatient}
								/>
							</Control>
							<FieldErrors class="text-sm mt-1" />
						</Field>
					</div>
				</div>
			{/if}
		</fieldset>
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
