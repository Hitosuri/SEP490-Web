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
	import ChangePasswordForm from '$lib/components/profile/ChangePasswordForm.svelte';
	import Breadcrumb from '$lib/components/common/Breadcrumb.svelte';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { Tooltip } from 'bits-ui';
	import { formatCompactDateTime } from '$lib/helpers/formatters';
	import { recordStatusInfo } from '$lib/constants/record-constant';
	import Container from '$lib/components/common/Container.svelte';

	export let data: PageData;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	let profile: Profile = data.profile;
	let profileEditting = false;
	let passwordEditting = false;
	let editProfileForm: SuperValidated<z.infer<typeof editProfileSchema>> | undefined;
	let changePasswordForm: SuperValidated<z.infer<typeof changePasswordSchema>> | undefined;

	$: console.log(data);

	async function profileStartEditting() {
		if (!editProfileForm) {
			editProfileForm = await superValidate(zod(editProfileSchema));
			editProfileForm.data.name = profile.name;
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
<Container paddingTopHeader class="py-4">
	<Breadcrumb crumbs={[{ label: 'Tài khoản cá nhân' }]} highlight />
	<div class="rounded-lg shadow-lg overflow-hidden border mt-4 bg-white">
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
	<div class="rounded-lg shadow-lg overflow-hidden border mt-8 bg-white">
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
	{#if $userStore?.isPatient && data.records}
		<div class="rounded-lg shadow-lg overflow-hidden border mt-8">
			<div class="py-4 px-6 border-b">
				<h3 class="h3 font-semibold">Hồ sơ khám bệnh</h3>
			</div>
			<div>
				<table class="w-full">
					<thead>
						<tr>
							<th class="h-10 table-cell-fit px-4"></th>
							<th class="text-start px-4">Bác sĩ</th>
							<th class="text-end px-4">Số điện thoại</th>
							<th class="text-start px-4">Lý do</th>
							<th class="px-4">Thời gian khám</th>
							<th class="px-4">Trạng thái</th>
							<th class="px-4">Tái khám</th>
						</tr>
					</thead>
					<tbody>
						{#each data.records as record (record.id)}
							<tr class="border-t odd:bg-stone-50">
								<td class="px-4 py-2">
									<Tooltip.Root openDelay={0}>
										<Tooltip.Trigger asChild let:builder>
											<a
												use:builder.action
												{...builder}
												href="/records/{record.id}"
												class="btn-icon variant-outline-surface rounded-xl hover:variant-ghost-tertiary"
											>
												<i class="fa-solid fa-circle-info"></i>
											</a>
										</Tooltip.Trigger>
										<Tooltip.Content
											transition={fly}
											transitionConfig={{
												duration: 200,
												y: 30,
												easing: cubicOut
											}}
											sideOffset={8}
											class="shadow-md font-semibold px-4 py-3 border rounded-md bg-white"
										>
											Chi tiết
											<Tooltip.Arrow class="border-l border-t" />
										</Tooltip.Content>
									</Tooltip.Root>
								</td>
								<td class="text-start px-4">{record.doctorName}</td>
								<td class="text-end px-4">{record.doctorPhone}</td>
								<td class="text-start px-4">{record.reason}</td>
								<td class="text-center px-4">{formatCompactDateTime(record.visitDate)}</td>
								<td class="text-center px-4">{recordStatusInfo[record.status]?.label}</td>
								<td class="text-center px-4">
									<input
										type="checkbox"
										disabled
										checked={record.isReVisit}
										class="checkbox bg-white"
									/>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</Container>
