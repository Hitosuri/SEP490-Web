<script lang="ts">
	import { editProfileSchema } from '$lib/form-schemas/edit-profile-schema';
	import { formatCurrency } from '$lib/helpers/formatters';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { dateProxy, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import DatePicker from '../common/DatePicker.svelte';
	import type { ComponentEvents } from 'svelte';
	import { CalendarDate } from '@internationalized/date';
	import { createEventDispatcher, getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import endpoints from '$lib/endpoints';
	import { type Writable } from 'svelte/store';

	export let editProfileForm: SuperValidated<z.infer<typeof editProfileSchema>>;
	export let profile: Profile;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const dispatch = createEventDispatcher<{ cancel: undefined; finish: Profile }>();
	const form = superForm(editProfileForm, {
		validators: zodClient(editProfileSchema),
		invalidateAll: false,
		resetForm: false,
		SPA: true,
		onUpdate: ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}

			toast.promise(
				async (): Promise<string> => {
					const url = $userStore.isPatient
						? endpoints.profile.editByPatient
						: endpoints.profile.edit;
					const response = await fetch(url, {
						method: 'PUT',
						headers: {
							'content-type': 'application/json',
							Authorization: `Bearer ${$userStore.token}`
						},
						body: JSON.stringify(form.data)
					});

					if (!response.ok) {
						const result = await response.json();
						let msg = '';
						if (typeof result === 'string') {
							msg = result;
						} else if (Array.isArray(result)) {
							msg = result.join(', ');
						}
						return Promise.reject(msg);
					}

					return 'Cập nhật profile thành công';
				},
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Cập nhật profile thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình tạo bệnh nhân'
				}
			);
		}
	});
	const { form: formData, enhance } = form;
	const today = new Date();
	const birthDateProxy = dateProxy(formData, 'birthday', { format: 'date', empty: undefined });

	function birthdayChanged(e: ComponentEvents<DatePicker>['valueChange']) {
		if (e.detail) {
			e.detail.setMinutes(e.detail.getMinutes() - e.detail.getTimezoneOffset());
			$formData.birthday = e.detail;
		}
	}
</script>

<form
	action="/profile?/editProfile"
	use:enhance
	method="post"
	class="grid grid-cols-1 sm:grid-cols-2 gap-y-6 py-4 px-6 gap-x-8"
>
	<div class="flex gap-4">
		<div
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg flex-shrink-0"
		>
			<i class="fa-solid fa-user"></i>
		</div>
		<div>
			<Field {form} name="name">
				<Control let:attrs>
					<Label class="text-xs sm:text-sm font-semibold text-surface-500 select-none"
						>Họ và tên</Label
					>
					<input
						{...attrs}
						type="text"
						class="input rounded-container-token mt-1"
						bind:value={$formData.name}
					/>
				</Control>
				<FieldErrors />
			</Field>
		</div>
	</div>
	<div class="flex gap-4">
		<div
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg flex-shrink-0"
		>
			<i class="fa-solid fa-at"></i>
		</div>
		<div class="overflow-hidden">
			<p class="text-xs sm:text-sm font-semibold text-surface-500 select-none">Email</p>
			<p
				class="text-lg sm:text-xl font-medium tracking-wide text-surface-300 overflow-hidden text-ellipsis whitespace-nowrap"
			>
				{profile.email}
				<i class="fa-solid fa-lock text-error-500 text-base ml-1"></i>
			</p>
		</div>
	</div>
	<div class="flex gap-4">
		<div
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg flex-shrink-0"
		>
			<i class="fa-solid fa-phone"></i>
		</div>
		<div>
			<Field {form} name="phone">
				<Control let:attrs>
					<Label class="text-xs sm:text-sm font-semibold text-surface-500 select-none"
						>Số điện thoại</Label
					>
					<input
						{...attrs}
						type="text"
						class="input rounded-container-token mt-1"
						bind:value={$formData.phone}
					/>
				</Control>
				<FieldErrors />
			</Field>
		</div>
	</div>
	<div class="flex gap-4">
		<div
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg flex-shrink-0"
		>
			<i class="fa-solid fa-cake-candles"></i>
		</div>
		<div>
			<Field {form} name="birthday">
				<Control let:attrs>
					<Label class="text-xs sm:text-sm font-semibold text-surface-500 select-none"
						>Ngày sinh</Label
					>
					<input
						{...attrs}
						type="hidden"
						class="input rounded-container-token mt-1"
						bind:value={$birthDateProxy}
					/>
					<DatePicker
						initValue={profile.birthday}
						regionInput="mt-1 w-[250px]"
						preventDeselect={true}
						on:valueChange={birthdayChanged}
						maxValue={new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())}
					/>
				</Control>
				<FieldErrors />
			</Field>
		</div>
	</div>
	{#if !$userStore?.isPatient}
		<div class="flex gap-4">
			<div
				class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg flex-shrink-0"
			>
				<i class="fa-solid fa-hand-holding-circle-dollar"></i>
			</div>
			<div>
				<p class="text-xs sm:text-sm font-semibold text-surface-500 select-none">Lương</p>
				<p class="text-xl font-medium tracking-wide text-surface-300">
					{formatCurrency(profile.salary)}
					<i class="fa-solid fa-lock text-error-500 text-base ml-1"></i>
				</p>
			</div>
		</div>
	{/if}
	<div class="sm:col-span-2 flex justify-center *:w-36 gap-6 py-4">
		<button
			type="button"
			class="btn variant-ghost-error text-error-500 font-semibold"
			on:click={() => dispatch('cancel')}
		>
			Huỷ
		</button>
		<button type="submit" class="btn variant-filled-primary font-semibold">Cập nhật</button>
	</div>
</form>
