<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { PageData } from './$types';
	import { cubicOut } from 'svelte/easing';
	import { editProfileSchema } from '$lib/form-schemas/edit-profile-schema';
	import { superValidate, type SuperValidated } from 'sveltekit-superforms';
	import { z } from 'zod';
	import { changePasswordSchema } from '$lib/form-schemas/change-password-schema';
	import ProfileInfo from '$lib/components/profile/ProfileInfo.svelte';
	import EditProfileForm from '$lib/components/profile/EditProfileForm.svelte';
	import { zod } from 'sveltekit-superforms/adapters';
	import { onMount } from 'svelte';
	import ChangePasswordForm from '$lib/components/profile/ChangePasswordForm.svelte';

	export let data: PageData;

	let profile: Profile = data.profile;
	let profileEditting = false;
	let passwordEditting = false;
	let editProfileForm: SuperValidated<z.infer<typeof editProfileSchema>> | undefined;
	let changePasswordForm: SuperValidated<z.infer<typeof changePasswordSchema>> | undefined;

	async function profileStartEditting() {
		if (!editProfileForm) {
			editProfileForm = await superValidate(zod(editProfileSchema));
			editProfileForm.data.name = profile.name;
			editProfileForm.data.userName = profile.userName;
			editProfileForm.data.phone = profile.phone;
			editProfileForm.data.birthday = profile.birthday;
		}
		profileEditting = true;
	}

	async function passwordStartEditting() {
		if (!changePasswordForm) {
			changePasswordForm = await superValidate(zod(changePasswordSchema));
		}
		passwordEditting = true;
	}
</script>

<svelte:head>
	<title>Tài khoản</title>
</svelte:head>
<div class="p-4 pt-header container mx-auto">
	<div class="rounded-lg shadow-lg overflow-hidden border mt-8">
		<div class="py-4 px-6 border-b flex">
			<h3 class="h3 font-semibold">
				{profileEditting ? 'Sửa thông tin tài khoản' : 'Thông tin tài khoản'}
			</h3>
			{#if !profileEditting}
				<button
					transition:fly={{
						duration: 200,
						x: -20,
						easing: cubicOut
					}}
					class="btn btn-sm variant-filled-tertiary ml-auto"
					on:click={profileStartEditting}
				>
					<i class="fa-solid fa-pen-to-square"></i>
					<span>Sửa</span>
				</button>
			{/if}
		</div>
		{#if !profileEditting}
			<ProfileInfo {profile} />
		{:else if editProfileForm}
			<EditProfileForm
				{profile}
				{editProfileForm}
				on:cancel={() => (profileEditting = false)}
				on:finish={(e) => {
					profile = e.detail;
					profileEditting = false;
					editProfileForm = undefined;
				}}
			/>
		{/if}
	</div>
	<div class="rounded-lg shadow-lg overflow-hidden border mt-8">
		<div class="py-4 px-6 border-b">
			<h3 class="h3 font-semibold">
				{#if passwordEditting}
					Thay đổi mật khẩu
				{:else}
					Bảo mật
				{/if}
			</h3>
		</div>
		<div class="py-4 px-6">
			<div class="flex gap-4 relative">
				<div
					class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg shrink-0"
				>
					<i class="fa-solid fa-key"></i>
				</div>
				<div>
					{#if !passwordEditting}
						<p class="text-sm font-semibold text-surface-500 select-none">Mật khẩu</p>
						<p class="text-xl font-medium tracking-wide">••••••••••••••••••••</p>
					{:else if changePasswordForm}
						<ChangePasswordForm
							{changePasswordForm}
							on:cancel={() => (passwordEditting = false)}
							on:finish={() => (passwordEditting = false)}
						/>
					{/if}
				</div>
				{#if !passwordEditting}
					<button
						transition:fly={{
							duration: 200,
							x: -20,
							easing: cubicOut
						}}
						class="btn btn-sm variant-filled-tertiary h-fit self-center absolute right-0"
						on:click={passwordStartEditting}
					>
						<i class="fa-solid fa-pen-to-square"></i>
						<span>Sửa</span>
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
