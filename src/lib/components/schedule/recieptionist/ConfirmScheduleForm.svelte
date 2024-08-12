<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import SuperDebug, { setError, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import { type Writable } from 'svelte/store';
	import { editScheduleSchema } from '$lib/form-schemas/edit-schedule-schema';
	import { Slider } from 'bits-ui';
	import { ScheduleStatus, scheduleStepInMinute } from '$lib/constants/schedule-constant';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { formatHourMinute } from '$lib/helpers/formatters';
	import endpoints from '$lib/endpoints';
	import { pascalToCamelcase } from '$lib/helpers/utils';

	export let editScheduleForm: SuperValidated<z.infer<typeof editScheduleSchema>>;
	export let schedule: ScheduleFull;

	export let maxStep: number;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const modalStore = getModalStore();
	const form = superForm(editScheduleForm, {
		validators: zodClient(editScheduleSchema),
		resetForm: false,
		SPA: true,
		onUpdate: ({ form }) => {
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
					closeModal(true);
					return 'Xác nhận lịch hẹn thành công';
				},
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Xác nhận lịch hẹn thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình xác nhận lịch hẹn'
				}
			);
		}
	});
	const { form: formData, enhance, allErrors } = form;
	const scheduleMaxLengthText =
		(Math.floor(maxStep / 4) || '') +
		(Math.floor(maxStep / 4) ? 'h' : '') +
		String((maxStep % 4) * 15).padStart(2, '0') +
		"'";
	let requesting = false;
	let sliderValue: number[] = [1];

	$formData.doctorId = schedule.doctor.id;
	$formData.description = schedule.description ?? '';
	$formData.status = ScheduleStatus.CONFIRMED;
	$formData.startAt = schedule.startAt;

	$: scheduleLengthText =
		(Math.floor(sliderValue[0] / 4) || '') +
		(Math.floor(sliderValue[0] / 4) ? 'h' : '') +
		String((sliderValue[0] % 4) * 15).padStart(2, '0') +
		"'";
	$: $formData.endAt = new Date(
		schedule.startAt.getFullYear(),
		schedule.startAt.getMonth(),
		schedule.startAt.getDate(),
		schedule.startAt.getHours(),
		schedule.startAt.getMinutes() + sliderValue[0] * scheduleStepInMinute
	);

	function closeModal(responseValue: boolean = false) {
		$modalStore[0]?.response?.(responseValue);
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
			on:click={() => closeModal()}
		>
			<i class="fa-solid fa-xmark"></i>
		</button>
	</div>
	<h1 class="font-semibold text-2xl mt-6">Tạo lịch hẹn</h1>
	<p class="font-semibold text-surface-400 mb-6">Tạo lịch hẹn khám cho bệnh nhân</p>
	<form use:enhance method="post">
		<fieldset disabled={requesting} class="grid grid-cols-2 gap-4">
			<div>
				<p class="font-semibold text-surface-500 select-none mb-1">Bệnh nhân</p>
				<div
					class="text-xl font-semibold tracking-wide h-[42px] text-center leading-[42px] text-primary-600"
				>
					{schedule.patient.name}
				</div>
			</div>
			<div>
				<p class="font-semibold text-surface-500 select-none mb-1">Bác sĩ</p>
				<div
					class="text-xl font-semibold tracking-wide h-[42px] text-center leading-[42px] text-primary-600"
				>
					{schedule.doctor.name}
				</div>
			</div>
			<div class="col-span-2">
				<p class="font-semibold text-surface-500 select-none mb-1">
					Thời lượng khám
					<span class="text-sm text-black font-medium">(Tối đa {scheduleMaxLengthText})</span>
				</p>
				<div>
					<div class="flex justify-between font-semibold text-sm mb-2 text-primary-600">
						<div class="w-12 text-center">15'</div>
						<div class="w-12 text-center">{scheduleMaxLengthText}</div>
					</div>
					<Slider.Root
						min={1}
						max={maxStep}
						step={1}
						let:thumbs
						let:ticks
						bind:value={sliderValue}
						class="bg-primary-100 mx-6 block relative h-2 rounded-full mb-2.5"
					>
						<Slider.Range class="h-2 rounded-full bg-primary-500" />
						<div class="w-full absolute -bottom-1">
							{#each ticks as tick}
								<Slider.Tick
									{tick}
									class="h-1.5 w-0 border-r border-primary-500/40 data-[bounded]:border-primary-600"
								/>
							{/each}
						</div>
						{#each thumbs as thumb}
							<Slider.Thumb
								data-time={scheduleLengthText}
								{thumb}
								class="size-6 cursor-pointer shadow border border-surface-400/40 hover:border-surface-400/80 shadow-black/30 -translate-y-2 rounded-full !outline-0 bg-white active:ring-4 active:ring-primary-500/30 transition-shadow before:rounded-full before:absolute before:top-1 before:left-1 before:right-1 before:bottom-1 before:bg-primary-500 after:absolute after:shadow-md after:bg-white after:rounded-md after:border after:px-2 after:py-1 after:text-sm after:font-semibold after:-top-10 after:left-1/2 after:-translate-x-1/2 after:hidden active:after:block hover:after:block after:content-[attr(data-time)]"
							/>
						{/each}
					</Slider.Root>
					<p class="px-6 pt-4 text-xl text-surface-900 text-center">
						<span class="uppercase">Thời gian khám:</span>
						<span class="font-semibold">
							{formatHourMinute(schedule.startAt)}
							-
							{formatHourMinute($formData.endAt)}
						</span>
					</p>
				</div>
			</div>
			<div class="col-span-2">
				<Field {form} name="description">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none mb-1">Mô tả</Label>
						<textarea
							class="textarea rounded-md bg-white"
							{...attrs}
							rows="4"
							placeholder="Nhập mô tả..."
							bind:value={$formData.description}
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
			<button type="button" class="variant-soft-surface" on:click={() => closeModal()}>
				<i class="fa-regular fa-door-closed"></i>
				<span class="pl-1">Huỷ</span>
			</button>
			<button type="submit" class="variant-filled-primary">
				<i class="fa-regular fa-handshake"></i>
				<span class="pl-1">Xác nhận lịch hẹn</span>
			</button>
		</fieldset>
	</form>
</div>
