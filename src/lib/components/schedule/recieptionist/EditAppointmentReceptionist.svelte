<script lang="ts">
	import { autoHeightTextArea } from '$lib/actions/auto-height-textarea';
	import NumberInput from '$lib/components/common/NumberInput.svelte';
	import endpoints from '$lib/endpoints';
	import { editScheduleSchema } from '$lib/form-schemas/edit-schedule-schema';
	import { formatCompactDate, formatFullDate, formatHourMinute } from '$lib/helpers/formatters';
	import { pascalToCamelcase } from '$lib/helpers/utils';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { createEventDispatcher, getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { Writable } from 'svelte/store';
	import SuperDebug, { setError, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	export let editScheduleForm: SuperValidated<z.infer<typeof editScheduleSchema>>;
	export let schedule: ScheduleFull;
	export let startAt: Date;
	export let endAt: Date;
	export let doctor: UserMinimal | undefined;

	const dispatch = createEventDispatcher<{ cancel: undefined; updated: undefined }>();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const form = superForm(editScheduleForm, {
		validators: zodClient(editScheduleSchema),
		resetForm: false,
		SPA: true,
		onUpdate: ({ form }) => {
			console.log(form);
			if (!form.valid || !$userStore) {
				return;
			}

			toast.promise(
				async (): Promise<string> => {
					const response = await fetch(endpoints.schedule.editByRecieptionist(schedule.id), {
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
					dispatch('updated');
					return 'Cập nhật lịch hẹn thành công';
				},
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Cập nhật lịch hẹn thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình cập nhật lịch hẹn'
				}
			);
		}
	});
	const { form: formData, enhance } = form;
	let requesting = false;
	let anotherPatient: Exclude<
		z.infer<typeof editScheduleSchema>['scheduleForAnotherRequest'],
		undefined
	> = {
		createForPatientAge: schedule.anotherPersonDto?.createForPatientAge ?? 0,
		createForPatientName: schedule.anotherPersonDto?.createForPatientName ?? '',
		noteForPatientCreatedBy: schedule.anotherPersonDto?.noteForPatientCreatedBy ?? '',
		relationWithCurrentPatient: schedule.anotherPersonDto?.relationWithCurrentPatient ?? ''
	};
	let createForAnother = !!schedule.anotherPersonDto;

	$: $formData.doctorId = doctor?.id ?? 0;
	$: $formData.description = schedule.description ?? '';
	$: $formData.status = schedule.status;
	$: $formData.startAt = startAt;
	$: $formData.endAt = endAt;
	$: isTimeSelected = endAt.getTime() - startAt.getTime() > 0;
	$: $formData.scheduleForAnotherRequest = createForAnother ? anotherPatient : undefined;
</script>

<div class="bg-white border shadow-md rounded-container-token h-full py-1 pr-1">
	<div class="pl-4 p-3 h-full overflow-y-auto max-h-[26rem]">
		<h1 class="font-semibold text-xl mb-6 text-center">Sửa lịch hẹn</h1>
		<form use:enhance method="post" class="flex flex-col">
			<fieldset disabled={requesting} class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
				<div class="font-medium text-surface-500">Bệnh nhân:</div>
				<div class="text-end font-semibold">{schedule.patient.name}</div>
				<div class="font-medium text-surface-500">Bác sĩ:</div>
				<div class="text-end {doctor?.name ? 'font-semibold' : 'font-normal text-warning-500'}">
					{doctor?.name ?? '(Chưa chọn)'}
				</div>
				<div class="font-medium text-surface-500">Thời gian khám:</div>
				<div class="text-end {isTimeSelected ? 'font-semibold' : 'font-normal text-warning-500'}">
					{isTimeSelected
						? `${formatHourMinute(startAt)} - ${formatHourMinute(endAt)}`
						: '(Chưa chọn)'}
				</div>
				<div class="font-medium text-surface-500">Ngày khám:</div>
				<div class="text-end {isTimeSelected ? 'font-semibold' : 'font-normal text-warning-500'}">
					{isTimeSelected ? formatCompactDate(startAt) : '(Chưa chọn)'}
				</div>
				<Field {form} name="description">
					<Control let:attrs>
						<Label class="font-medium text-surface-500 select-none">
							Mô tả:<sup class="text-red-500">*</sup>
						</Label>
						<div class="flex flex-col">
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
							<FieldErrors class="text-sm mt-1" />
						</div>
					</Control>
				</Field>
				<div class="font-medium text-surface-500">Tạo lịch cho bệnh nhân khác:</div>
				<div class="flex justify-end">
					<SlideToggle name="create-for-another" size="sm" bind:checked={createForAnother} />
				</div>
				{#if createForAnother}
					<div
						class="col-span-2 grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 bg-slate-50 border rounded-md p-4"
					>
						<Field {form} name="scheduleForAnotherRequest.createForPatientName">
							<Control let:attrs>
								<Label class="font-medium text-surface-500 select-none">
									Tên bệnh nhân:<sup class="text-red-500">*</sup>
								</Label>
								<div class="flex flex-col">
									<input
										{...attrs}
										type="text"
										placeholder="Nhập tên bệnh nhân..."
										class="input rounded-container-token bg-white/100"
										bind:value={anotherPatient.createForPatientName}
									/>
									<FieldErrors class="text-sm mt-1" />
								</div>
							</Control>
						</Field>
						<Field {form} name="scheduleForAnotherRequest.createForPatientAge">
							<Control let:attrs>
								<Label class="font-medium text-surface-500 select-none">
									Tuổi bệnh nhân:<sup class="text-red-500">*</sup>
								</Label>
								<div class="flex flex-col">
									<div class="w-40 ml-auto">
										<NumberInput bind:value={anotherPatient.createForPatientAge} />
									</div>
									<FieldErrors class="text-sm mt-1" />
								</div>
							</Control>
						</Field>
						<Field {form} name="scheduleForAnotherRequest.createForPatientName">
							<Control let:attrs>
								<Label class="font-medium text-surface-500 select-none">
									Ghi chú cho người giám hộ:
								</Label>
								<div class="flex flex-col">
									<input
										{...attrs}
										type="text"
										placeholder="Nhập ghi chú..."
										class="input rounded-container-token bg-white/100"
										bind:value={anotherPatient.noteForPatientCreatedBy}
									/>
									<FieldErrors class="text-sm mt-1" />
								</div>
							</Control>
						</Field>
						<Field {form} name="scheduleForAnotherRequest.createForPatientName">
							<Control let:attrs>
								<Label class="font-medium text-surface-500 select-none">
									Quan hệ với giám hộ:<sup class="text-red-500">*</sup>
								</Label>
								<div class="flex flex-col">
									<input
										{...attrs}
										type="text"
										placeholder="Bố, mẹ, ông, bà..."
										class="input rounded-container-token bg-white/100"
										bind:value={anotherPatient.relationWithCurrentPatient}
									/>
									<FieldErrors class="text-sm mt-1" />
								</div>
							</Control>
						</Field>
					</div>
				{/if}
			</fieldset>
			<fieldset
				disabled={requesting}
				class="flex gap-4 mt-4 font-medium *:btn *:rounded-container-token *:flex-1"
			>
				<button type="button" class="variant-filled-error" on:click={() => dispatch('cancel')}>
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
</div>
