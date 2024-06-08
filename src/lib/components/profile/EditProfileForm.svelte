<script lang="ts">
	import { editProfileSchema } from '$lib/form-schemas/edit-profile-schema';
	import { formatCurrency } from '$lib/helpers/util';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { dateProxy, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import DatePicker from '../common/DatePicker.svelte';
	import type { ComponentEvents } from 'svelte';
	import { CalendarDate } from '@internationalized/date';
	import { createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';

	export let editProfileForm: SuperValidated<z.infer<typeof editProfileSchema>>;
	export let profile: Profile;

	const dispatch = createEventDispatcher<{ cancel: undefined; finish: Profile }>();
	const form = superForm(editProfileForm, {
		validators: zodClient(editProfileSchema),
		onResult: (event) => {
			if (event.result.type === 'success') {
				const msg = event.result?.data?.form?.message || 'Cập nhật profile thành công';
				toast.success(msg);
				dispatch('finish', {
					...profile,
					name: $formData.name,
					userName: $formData.userName,
					phone: $formData.phone,
					birthday: $formData.birthday
				});
			}
			if (event.result.type === 'failure' && event.result?.data?.form?.message) {
				toast.error(event.result?.data?.form?.message);
			}
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
	class="grid grid-cols-2 gap-y-6 py-4 px-6"
>
	<div class="flex gap-4">
		<div
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg"
		>
			<i class="fa-solid fa-user"></i>
		</div>
		<div>
			<Field {form} name="name">
				<Control let:attrs>
					<Label class="text-sm font-semibold text-surface-500 select-none">Họ và tên</Label>
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
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg"
		>
			<i class="fa-solid fa-id-badge"></i>
		</div>
		<div>
			<Field {form} name="userName">
				<Control let:attrs>
					<Label class="text-sm font-semibold text-surface-500 select-none">Tên đăng nhập</Label>
					<input
						{...attrs}
						type="text"
						class="input rounded-container-token mt-1"
						bind:value={$formData.userName}
					/>
				</Control>
				<FieldErrors />
			</Field>
		</div>
	</div>
	<div class="flex gap-4">
		<div
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg"
		>
			<i class="fa-solid fa-at"></i>
		</div>
		<div>
			<p class="text-sm font-semibold text-surface-500 select-none">Email</p>
			<p class="text-xl font-medium tracking-wide text-surface-300">
				{profile.email}
				<i class="fa-solid fa-lock text-error-500 text-base ml-1"></i>
			</p>
		</div>
	</div>
	<div class="flex gap-4">
		<div
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg"
		>
			<i class="fa-solid fa-phone"></i>
		</div>
		<div>
			<Field {form} name="phone">
				<Control let:attrs>
					<Label class="text-sm font-semibold text-surface-500 select-none">Số điện thoại</Label>
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
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg"
		>
			<i class="fa-solid fa-cake-candles"></i>
		</div>
		<div>
			<Field {form} name="birthday">
				<Control let:attrs>
					<Label class="text-sm font-semibold text-surface-500 select-none">Ngày sinh</Label>
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
	<div class="flex gap-4">
		<div
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg"
		>
			<i class="fa-solid fa-hand-holding-circle-dollar"></i>
		</div>
		<div>
			<p class="text-sm font-semibold text-surface-500 select-none">Lương</p>
			<p class="text-xl font-medium tracking-wide text-surface-300">
				{formatCurrency(profile.salary)}
				<i class="fa-solid fa-lock text-error-500 text-base ml-1"></i>
			</p>
		</div>
	</div>
	<div class="col-span-2 flex justify-center *:w-36 gap-6 py-4">
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
