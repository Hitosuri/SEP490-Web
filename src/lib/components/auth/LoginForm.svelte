<script lang="ts">
	import { page } from '$app/stores';
	import { loginSchema } from '$lib/form-schemas/login-schema';
	import { SlideToggle, focusTrap } from '@skeletonlabs/skeleton';
	import { Field, Control, Label, FieldErrors } from 'formsnap';
	import { toast } from 'svelte-sonner';
	import type { HTMLInputTypeAttribute } from 'svelte/elements';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import endpoints from '$lib/endpoints';
	import Loading from '../common/Loading.svelte';

	export let loginForm: SuperValidated<z.infer<typeof loginSchema>>;
	export let modal = false;

	const form = superForm(loginForm, {
		validators: zodClient(loginSchema),
		invalidateAll: false,
		onSubmit: () => {
			requesting = true;
			const promise = new Promise<string>((resolve, reject) => {
				submitingResolve = resolve;
				submitingReject = reject;
			});
			toast.promise(promise, {
				loading: 'Đang đăng nhập...',
				success: (msg) => msg || 'Đăng nhập thành công',
				error: (msg) => String(msg ?? '') || 'Xảy ra lỗi khi đăng nhập'
			});
		},
		onResult: (e) => {
			requesting = false;
			if (e.result.type === 'redirect') {
				submitingResolve?.('Đăng nhập thành công');
			} else if (e.result.type === 'failure') {
				const msg = e.result?.data?.form?.message ?? 'Xảy ra lỗi khi đăng nhập';
				submitingReject?.(msg);
			} else {
				submitingReject?.('Xảy ra lỗi khi đăng nhập');
			}
			submitingResolve = undefined;
			submitingReject = undefined;
		}
	});
	const { form: formData, enhance } = form;
	let revealPassword = false;
	let passwordFieldType: HTMLInputTypeAttribute;
	let forgetPasswordForm = false;
	let emailSent = false;
	let emailInput = '';
	let requesting = false;
	let submitingResolve: ((value: string | PromiseLike<string>) => void) | undefined;
	let submitingReject: ((reason?: any) => void) | undefined;
	let isUser = false;
	let resetPasswordPromise: Promise<void>;

	$: resetable = z.string().trim().email().safeParse(emailInput).success;
	$: passwordFieldType = revealPassword ? 'text' : 'password';
	$: backParam = `backTo=${encodeURI(decodeURI($page.url.searchParams.get('backTo') ?? ''))}`;

	function resetPassword() {
		const baseUrl = isUser ? endpoints.auth.resetPassword : endpoints.auth.resetPasswordPatient;
		resetPasswordPromise = fetch(baseUrl(emailInput.trim()), {
			method: 'PUT'
		}).then(async (response) => {
			if (!response.ok) {
				return Promise.reject();
			}
		});
		emailSent = true;
	}

	function backToLogin() {
		forgetPasswordForm = false;
		emailSent = false;
	}
</script>

<div
	class="bg-white card rounded-container-token mx-auto w-full overflow-hidden {!modal
		? 'sm:w-5/6 md:w-3/4 lg:w-3/5 xl:w-1/2 2xl:w-[720px] shadow-lg shadow-black/20'
		: ''}"
>
	<header
		class="card-header border-b px-10 py-4 bg-surface-50/40 flex justify-between items-center"
	>
		<h4 class="h4 font-semibold">
			{#if forgetPasswordForm}
				Đặt lại mật khẩu
			{:else}
				Đăng nhập vào tài khoản Nha khoa Trịnh
			{/if}
		</h4>
		<slot name="closeBtn" />
	</header>
	<section class="px-10 py-4">
		{#if forgetPasswordForm}
			<button
				class="btn btn-sm variant-soft-tertiary mb-3 font-semibold gap-1 px-4"
				on:click={backToLogin}
			>
				<i class="fa-solid fa-chevron-left"></i>
				<span>Trở lại đăng nhập</span>
			</button>
			{#if emailSent}
				{#await resetPasswordPromise}
					<Loading class="w-full justify-center py-10" />
				{:then}
					<p class="text-lg font-semibold p-4">
						Email đã được gửi tới email
						<span class="text-primary-500">{emailInput.trim()}</span>, vui phòng kiểm tra và đăng
						nhập bằng mật khẩu mới!
					</p>
				{:catch}
					<p class="text-lg font-semibold p-4 text-center">
						Đã xảy ra lỗi trong quá trình đặt lại mật khẩu!
					</p>
					<button
						class="btn variant-filled-primary mx-auto block"
						on:click={resetPassword}
						disabled={!resetable}
					>
						Gửi lại yêu cầu
					</button>
				{/await}
			{:else}
				<label class="font-medium mb-1" for="email-for-reset">Email của tài khoản</label>
				<input
					class="input rounded-container-token data-[fs-error]:input-error"
					type="text"
					name="email"
					id="email-for-reset"
					bind:value={emailInput}
				/>
				<div class="mt-3 flex justify-between">
					<p>
						<span class="font-medium">Bạn là:</span>
						<span
							class="flex-1 shrink-0 {isUser
								? 'text-surface-400 font-semibold'
								: 'text-primary-500 font-bold'}"
						>
							Bệnh nhân
						</span>
						|
						<span
							class="flex-1 shrink-0 {!isUser
								? 'text-surface-400 font-semibold'
								: 'text-primary-500 font-bold'}"
						>
							Bác sĩ, nhân viên...
						</span>
					</p>
					<SlideToggle name="is-user" size="sm" bind:checked={isUser} />
				</div>
				<p class="text-sm mt-4 text-surface-500">
					<span class="text-red-500">*</span>Sau khi bạn nhập email của tài khoản và xác nhận đặt
					lại mật khẩu, chúng tôi sẽ gửi mật khẩu mới vào email của bạn
				</p>
				<button
					class="btn variant-filled-primary mx-auto block mt-4"
					on:click={resetPassword}
					disabled={!resetable}
				>
					Đặt lại mật khẩu
				</button>
			{/if}
		{:else}
			<form action="/auth?/login&{backParam}" method="post" use:enhance use:focusTrap={true}>
				<fieldset disabled={requesting} class="space-y-4">
					<div>
						<Field name="emailOrPhone" {form}>
							<Control let:attrs>
								<Label class="font-medium mb-1">Email hoặc số điện thoại</Label>
								<input
									class="input rounded-container-token data-[fs-error]:input-error"
									type="text"
									{...attrs}
									bind:value={$formData.emailOrPhone}
								/>
							</Control>
							<FieldErrors class="mt-1" />
						</Field>
					</div>
					<div>
						<Field name="password" {form}>
							<Control let:attrs>
								<Label class="font-medium mb-1">Mật khẩu</Label>
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
						<button
							type="button"
							on:click={() => (forgetPasswordForm = true)}
							class="text-sm ml-auto font-semibold text-primary-500 hover:underline"
						>
							Quên mật khẩu?
						</button>
					</div>
					<div>
						<Field name="isUser" {form}>
							<Control let:attrs>
								<Label class="font-medium mb-1 w-fit">Bạn là:</Label>
								<div class="flex justify-center items-center gap-4 font-semibold">
									<p
										class="flex-1 shrink-0 text-end {$formData.isUser
											? 'text-surface-400'
											: 'text-primary-500'}"
									>
										Bệnh nhân
									</p>
									<SlideToggle size="sm" {...attrs} bind:checked={$formData.isUser} />
									<p
										class="flex-1 shrink-0 {!$formData.isUser
											? 'text-surface-400'
											: 'text-primary-500'}"
									>
										Bác sĩ, nhân viên...
									</p>
								</div>
							</Control>
						</Field>
					</div>
					<button
						type="submit"
						class="btn variant-filled-primary w-1/2 mx-auto block font-semibold"
					>
						Đăng nhập
					</button>
				</fieldset>
			</form>
		{/if}
	</section>
	<footer class="card-footer border-t p-4 text-sm text-center bg-surface-50/40 justify-center">
		<span class="text-black/70 font-semibold">Chưa có tài khoản?</span>
		<a
			href="https://www.facebook.com/Nhakhoabacsytrinh.con"
			class="font-semibold text-primary-500 hover:underline"
			target="_blank"
		>
			Liên hệ với chúng tôi ngay.
		</a>
	</footer>
</div>
