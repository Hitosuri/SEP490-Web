<script lang="ts">
	import { page } from '$app/stores';
	import { loginSchema } from '$lib/form-schemas/login-schema';
	import { focusTrap } from '@skeletonlabs/skeleton';
	import { Field, Control, Label, FieldErrors } from 'formsnap';
	import type { HTMLInputTypeAttribute } from 'svelte/elements';
	import { superForm, type FormResult, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	export let loginForm: SuperValidated<z.infer<typeof loginSchema>>;
	export let modal = false;

	const form = superForm(loginForm, {
		validators: zodClient(loginSchema),
		invalidateAll: false
	});
	const { form: formData, enhance } = form;
	let revealPassword = false;
	let passwordFieldType: HTMLInputTypeAttribute;

	$: passwordFieldType = revealPassword ? 'text' : 'password';
	$: backParam = `backTo=${encodeURI(decodeURI($page.url.searchParams.get('backTo') ?? ''))}`;
</script>

<div
	class="bg-white card rounded-container-token mx-auto w-full overflow-hidden {!modal
		? 'sm:w-5/6 md:w-3/4 lg:w-3/5 xl:w-1/2 2xl:w-[720px]'
		: ''}"
>
	<header
		class="card-header border-b px-10 py-4 bg-surface-50/40 flex justify-between items-center"
	>
		<h4 class="h4 font-semibold">Đăng nhập vào tài khoản Nha khoa Trịnh</h4>
		<slot name="closeBtn" />
	</header>
	<section class="px-10 py-4">
		<form
			action="/auth?/login&{backParam}"
			method="post"
			use:enhance
			class="space-y-4"
			use:focusTrap={true}
		>
			<div>
				<Field name="userName" {form}>
					<Control let:attrs>
						<Label class="font-medium">Tên đăng nhập</Label>
						<input
							class="input rounded-container-token data-[fs-error]:input-error"
							type="text"
							{...attrs}
							bind:value={$formData.userName}
						/>
					</Control>
					<FieldErrors class="mt-1" />
				</Field>
			</div>
			<div>
				<Field name="password" {form}>
					<Control let:attrs>
						<Label class="font-medium">Mật khẩu</Label>
						<div class="relative">
							<input
								class="input pr-12 peer rounded-container-token data-[fs-error]:input-error"
								{...{ type: passwordFieldType }}
								{...attrs}
								bind:value={$formData.password}
							/>
							<button
								type="button"
								class="btn px-3 variant-soft-primary peer-data-[fs-error]:variant-soft-error rounded-md absolute top-1 right-1"
								on:click={() => (revealPassword = !revealPassword)}
							>
								<i class="fa-solid {revealPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
							</button>
						</div>
					</Control>
					<FieldErrors class="mt-1" />
				</Field>
			</div>
			<div class="flex gap-2">
				<Field name="rememberMe" {form}>
					<Control let:attrs>
						<input
							class="checkbox bg-white"
							type="checkbox"
							{...attrs}
							bind:checked={$formData.rememberMe}
						/>
						<Label class="text-sm !font-semibold">Ghi nhớ đăng nhập</Label>
					</Control>
				</Field>
				<a href="#" class="text-sm ml-auto font-semibold text-primary-500 hover:underline">
					Quên mật khẩu?
				</a>
			</div>
			<button type="submit" class="btn variant-filled-primary w-1/2 mx-auto block font-semibold">
				Đăng nhập
			</button>
		</form>
	</section>
	<footer class="card-footer border-t p-4 text-sm text-center bg-surface-50/40 justify-center">
		<span class="text-black/70 font-semibold">Chưa có tài khoản?</span>
		<a href="#" class="font-semibold text-primary-500 hover:underline">Liên hệ với chúng tôi ngay.</a>
	</footer>
</div>
