<script lang="ts">
	import { changePasswordSchema } from '$lib/form-schemas/change-password-schema';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { z } from 'zod';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher, getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import endpoints from '$lib/endpoints';
	import { type Writable } from 'svelte/store';

	export let changePasswordForm: SuperValidated<z.infer<typeof changePasswordSchema>>;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const dispatch = createEventDispatcher<{ cancel: undefined; finish: undefined }>();
	const form = superForm(changePasswordForm, {
		validators: zodClient(changePasswordSchema),
		resetForm: false,
		SPA: true,
		onUpdate: async ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}

			toast.promise(
				async (): Promise<string> => {
					const url = $userStore.isPatient
						? endpoints.profile.changePasswordByPatient
						: endpoints.profile.changePasswordByUser;
					const response = await fetch(url, {
						method: 'PUT',
						headers: {
							'content-type': 'application/json',
							Authorization: `Bearer ${$userStore.token}`
						},
						body: JSON.stringify(form.data)
					});

					if (!response.ok) {
						const text = await response.text();
						const feedback = JSON.parse(text);
						if (Array.isArray(feedback) && feedback[0] === 'Old password is incorrect') {
							$errors.oldPassword = [...($errors.oldPassword ?? []), 'Mật khẩu cũ không đúng'];
							return Promise.reject('Mật khẩu cũ không đúng');
						}
						return Promise.reject();
					}

					dispatch('finish');

					return 'Cập nhật mật khẩu thành công';
				},
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Cập nhật mật khẩu thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình cập nhật mật khẩu'
				}
			);
		}
	});
	const { form: formData, enhance, errors } = form;
	let revealOldPassword = false;
	let revealNewPassword = false;
	let revealConfirmPassword = false;

	$: oldPasswordFieldType = revealOldPassword ? 'text' : 'password';
	$: newPasswordFieldType = revealNewPassword ? 'text' : 'password';
	$: confirmPasswordFieldType = revealConfirmPassword ? 'text' : 'password';
</script>

<form use:enhance action="/profile?/changePassword" method="post" class="flex gap-x-8">
	<div>
		<Field {form} name="oldPassword" let:errors>
			<Control let:attrs>
				<Label class="text-sm font-semibold text-surface-500 select-none">Mật khẩu cũ</Label>
				<div class="relative mt-1">
					<input
						{...attrs}
						{...{ type: oldPasswordFieldType }}
						class="input rounded-container-token pr-12"
						bind:value={$formData.oldPassword}
					/>
					<button
						type="button"
						class="btn px-3 rounded-md absolute top-1 right-1 variant-soft-primary"
						on:click={() => (revealOldPassword = !revealOldPassword)}
					>
						<i class="fa-solid {revealOldPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
					</button>
				</div>
			</Control>
			<FieldErrors class="mt-1" />
		</Field>
	</div>
	<div>
		<Field {form} name="newPassword">
			<Control let:attrs>
				<Label class="text-sm font-semibold text-surface-500 select-none">Mật khẩu mới</Label>
				<div class="relative mt-1">
					<input
						{...attrs}
						{...{ type: newPasswordFieldType }}
						class="input rounded-container-token pr-12"
						bind:value={$formData.newPassword}
					/>
					<button
						type="button"
						class="btn px-3 rounded-md absolute top-1 right-1 variant-soft-primary"
						on:click={() => (revealNewPassword = !revealNewPassword)}
					>
						<i class="fa-solid {revealNewPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
					</button>
				</div>
			</Control>
			<FieldErrors class="mt-1" />
		</Field>
	</div>
	<div>
		<Field {form} name="confirmPassword">
			<Control let:attrs>
				<Label class="text-sm font-semibold text-surface-500 select-none">Nhập lại mật khẩu</Label>
				<div class="relative mt-1">
					<input
						{...attrs}
						{...{ type: confirmPasswordFieldType }}
						class="input rounded-container-token pr-12"
						bind:value={$formData.confirmPassword}
					/>
					<button
						type="button"
						class="btn px-3 rounded-md absolute top-1 right-1 variant-soft-primary"
						on:click={() => (revealConfirmPassword = !revealConfirmPassword)}
					>
						<i class="fa-solid {revealConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
					</button>
				</div>
			</Control>
			<FieldErrors class="mt-1" />
		</Field>
	</div>
	<div class="flex justify-center *:w-36 gap-6 h-fit pt-6">
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
