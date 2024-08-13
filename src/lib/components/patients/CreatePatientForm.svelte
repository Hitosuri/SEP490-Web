<script lang="ts">
	import { dateProxy, setError, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { z } from 'zod';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher, getContext, type ComponentEvents } from 'svelte';
	import { toast } from 'svelte-sonner';
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { CalendarDate } from '@internationalized/date';
	import { createPatientSchema } from '$lib/form-schemas/create-patient-schema';
	import endpoints from '$lib/endpoints';
	import { pascalToCamelcase } from '$lib/helpers/utils';
	import { type Writable } from 'svelte/store';

	export let createPatientForm: SuperValidated<z.infer<typeof createPatientSchema>>;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const dispatch = createEventDispatcher<{ cancel: undefined; finish: undefined }>();
	const form = superForm(createPatientForm, {
		validators: zodClient(createPatientSchema),
		resetForm: false,
		SPA: true,
		onUpdate: ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}

			const requestBody: Record<string, any> = {
				...form.data
			};

			Object.entries(requestBody).forEach((x) => {
				if (!x[1]) {
					delete requestBody[x[0]];
				}
			});

			toast.promise(
				async () => {
					const response = await fetch(endpoints.patients.create, {
						method: 'POST',
						headers: {
							'content-type': 'application/json',
							Authorization: `Bearer ${$userStore.token}`
						},
						body: JSON.stringify(requestBody)
					});

					if (!response.ok) {
						const data = await response.json();
						let msg = '';
						if (typeof data?.error === 'string') {
							return Promise.reject(data?.error);
						} else if (Array.isArray(data?.error)) {
							msg = data.error.join(', ');
							data.error.forEach((err: string) => {
								if (typeof err === 'string') {
									if (err.startsWith('Bệnh nhân với số điện thoại')) {
										console.log(err);
										setError(form, 'phone', err);
									} else if (err.startsWith('Bệnh nhân với Email ')) {
										console.log(err);
										setError(form, 'email', err);
									}
								}
							});
						} else if (typeof data === 'object') {
							Object.keys(data).forEach((k) => {
								const fieldName = pascalToCamelcase(k);
								if (Object.keys(form.data).includes(fieldName)) {
									setError(form, fieldName, data[k]);
								}
							});
						}
						return Promise.reject(msg);
					}
					dispatch('finish');
				},
				{
					loading: 'Đang xử lý...',
					success: 'Tạo bệnh nhân thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình tạo bệnh nhân'
				}
			);
		}
	});
	const { form: formData, enhance } = form;
	const birthDateProxy = dateProxy(formData, 'birthday', { format: 'date', empty: undefined });
	const today = new Date();
	let requesting = false;

	function birthdayChanged(e: ComponentEvents<DatePicker>['valueChange']) {
		if (e.detail) {
			e.detail.setMinutes(e.detail.getMinutes() - e.detail.getTimezoneOffset());
			$formData.birthday = e.detail;
		} else {
			$formData.birthday = undefined;
		}
	}
</script>

<div class="card bg-white p-6">
	<div class="flex justify-between">
		<div class="text-2xl rounded-md border border-surface-200 size-14 text-center leading-[3.5rem]">
			<i class="fa-regular fa-bed-pulse"></i>
		</div>
		<slot name="closeBtn" />
	</div>
	<h1 class="font-semibold text-2xl mt-6">Thêm bệnh nhân mới</h1>
	<p class="font-semibold text-surface-400 mb-6">Nhập các thông tin của bệnh nhân mới</p>
	<form use:enhance method="post">
		<fieldset class="grid grid-cols-2 gap-4" disabled={requesting}>
			<div>
				<Field {form} name="phone">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">Số điện thoại</Label>
						<input
							{...attrs}
							type="text"
							placeholder="Nhập số điện thoại..."
							class="input rounded-container-token mt-1"
							bind:value={$formData.phone}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div>
				<Field {form} name="email">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">Email</Label>
						<input
							{...attrs}
							type="email"
							placeholder="Nhập email..."
							class="input rounded-container-token mt-1"
							bind:value={$formData.email}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div>
				<Field {form} name="name">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">Họ và tên</Label>
						<input
							{...attrs}
							type="text"
							placeholder="Nhập tên bệnh nhân..."
							class="input rounded-container-token mt-1"
							bind:value={$formData.name}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div>
				<Field {form} name="birthday">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">Ngày sinh</Label>
						<input
							{...attrs}
							type="hidden"
							class="input rounded-container-token mt-1"
							bind:value={$birthDateProxy}
						/>
						<DatePicker
							regionInput="mt-1 w-full"
							on:valueChange={birthdayChanged}
							maxValue={new CalendarDate(
								today.getFullYear(),
								today.getMonth() + 1,
								today.getDate()
							)}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
		</fieldset>
		<p class="text-sm mt-6 text-surface-500 font-medium">
			<span class="text-red-500">*</span>Khuyến khích có email để có thể đặt lại mật khẩu và gửi
			thông báo
		</p>
		<fieldset
			disabled={requesting}
			class="flex gap-4 mt-2 font-medium *:btn *:rounded-container-token *:flex-1"
		>
			<slot name="cancelBtn">
				<button type="button" class="variant-soft-surface">
					<i class="fa-solid fa-delete-left"></i>
					<span class="pl-1">Huỷ</span>
				</button>
			</slot>
			<button type="submit" class="variant-filled-primary">
				<i class="fa-solid fa-plus"></i>
				<span class="pl-1">Thêm</span>
			</button>
		</fieldset>
	</form>
</div>
