<script lang="ts">
	import { pushState } from '$app/navigation';
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import { Dialog } from 'bits-ui';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { page } from '$app/stores';
	import { loginSchema } from '$lib/form-schemas/login-schema';
	import { superValidate, type SuperValidated } from 'sveltekit-superforms';
	import { z } from 'zod';
	import { enhance } from '$app/forms';
	import userStore from '$lib/stores/user-store';
	import { DropdownMenu } from 'bits-ui';
	import { AppBar } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { zod } from 'sveltekit-superforms/adapters';

	let loginForm: SuperValidated<z.infer<typeof loginSchema>> | undefined;
	let logoutForm: HTMLFormElement;

	onMount(async () => {
		if ($userStore) {
			return;
		}
		loginForm = await superValidate(zod(loginSchema));
	});

	function onLoginModalOpenChange(state: boolean) {
		if (state) {
			pushState('/auth/login', {
				loginModal: true
			});
		} else {
			history.back();
		}
	}
</script>

<div class="fixed w-full pr-scroll-bar">
	<AppBar
		background="bg-white"
		padding="py-6"
		slotLead="h-10"
		slotDefault="flex justify-center gap-8 h-10"
		regionRowMain="container px-4 mx-auto"
	>
		<svelte:fragment slot="lead">
			<a href="/" class="px-3">
				<img class="h-12" src="/images/prodental.png" alt="" />
			</a>
		</svelte:fragment>
		<a href="#" class="group">
			<div class="flex flex-col h-8 justify-end">
				<p
					class="leading-5 pb-1 text-sm group-hover:pb-2 font-bold text-black/60 group-hover:text-black transition-all duration-160 ease-out px-2 uppercase tracking-wider"
				>
					Dịch vụ
				</p>
				<div
					class="bg-primary-500 h-1 transition-all duration-200 ease-out w-0 group-hover:w-full"
				></div>
			</div>
		</a>
		<a href="#" class="group">
			<div class="flex flex-col h-8 justify-end">
				<p
					class="leading-5 pb-1 text-sm group-hover:pb-2 font-bold text-black/60 group-hover:text-black transition-all duration-160 ease-out px-2 uppercase tracking-wider"
				>
					Tư vấn
				</p>
				<div
					class="bg-primary-500 h-1 transition-all duration-200 ease-out w-0 group-hover:w-full"
				></div>
			</div>
		</a>
		<a href="#" class="group">
			<div class="flex flex-col h-8 justify-end">
				<p
					class="leading-5 pb-1 text-sm group-hover:pb-2 font-bold text-black/60 group-hover:text-black transition-all duration-160 ease-out px-2 uppercase tracking-wider"
				>
					Về chúng tôi
				</p>
				<div
					class="bg-primary-500 h-1 transition-all duration-200 ease-out w-0 group-hover:w-full"
				></div>
			</div>
		</a>
		<svelte:fragment slot="trail">
			{#if !$userStore && $page.url.pathname !== '/auth/login'}
				<Dialog.Root onOpenChange={onLoginModalOpenChange} open={!!$page.state.loginModal}>
					<Dialog.Trigger
						class="btn bg-gradient-to-br from-primary-500 text-sm to-cyan-400 text-white font-semibold px-6 py-2"
					>
						Đăng nhập
					</Dialog.Trigger>
					<Dialog.Portal>
						<Dialog.Overlay
							transition={fade}
							transitionConfig={{
								duration: 200,
								easing: cubicOut
							}}
							class="fixed inset-0 z-50 bg-black/80"
						/>
						<Dialog.Content
							transition={fly}
							transitionConfig={{
								duration: 200,
								y: 100,
								easing: cubicOut
							}}
							class="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full sm:w-5/6 md:w-3/4 lg:w-3/5 xl:w-1/2 2xl:w-[720px] px-4"
						>
							{#if loginForm}
								<LoginForm {loginForm} modal>
									<svelte:fragment slot="closeBtn">
										<Dialog.Close asChild let:builder>
											<button
												use:builder.action
												{...builder}
												class="btn-icon text-2xl !outline-none text-black/60 hover:text-black transition-colors"
											>
												<i class="fa-solid fa-xmark"></i>
											</button>
										</Dialog.Close>
									</svelte:fragment>
								</LoginForm>
							{/if}
						</Dialog.Content>
					</Dialog.Portal>
				</Dialog.Root>
			{/if}
			{#if $userStore}
				<DropdownMenu.Root preventScroll={false}>
					<DropdownMenu.Trigger
						class="h-10 px-[10px] w-40 overflow-x-hidden rounded-full ring-surface-200 transition-all duration-300 variant-outline hover:variant-outline-primary hover:text-primary-500 flex items-center"
					>
						<i class="fa-solid fa-circle-user text-xl"></i>
						<span class="text-sm ml-2 text-ellipsis overflow-x-hidden">{$userStore.email}</span>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						transition={fly}
						transitionConfig={{
							duration: 200,
							y: 30,
							easing: cubicOut
						}}
						sideOffset={8}
						class="w-full max-w-[229px] rounded-md border border-surface-100 bg-white p-1 shadow-lg"
					>
						<DropdownMenu.Label class="text-center select-none text-xs p-1 font-bold">
							{$userStore.role}
						</DropdownMenu.Label>
						<DropdownMenu.Item
							href="/profile"
							class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-3 rounded select-none flex gap-3 items-center"
						>
							<div class="size-4 text-center">
								<i class="fa-solid fa-user block"></i>
							</div>
							<span class="font-semibold text-sm leading-4">Tài khoản</span>
						</DropdownMenu.Item>
						<DropdownMenu.Separator class="my-1 -ml-1 -mr-1 block h-px bg-surface-50" />
						<DropdownMenu.Item
							on:click={() => {
								logoutForm.requestSubmit();
							}}
							class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
						>
							<div class="size-4 text-center">
								<i class="fa-solid fa-right-from-bracket block"></i>
							</div>
							<span class="font-semibold text-sm leading-4">Đăng xuất</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}
			<form action="/auth?/logout" hidden method="post" use:enhance bind:this={logoutForm}></form>
		</svelte:fragment>
	</AppBar>
</div>
