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
	import { DropdownMenu } from 'bits-ui';
	import { AppBar } from '@skeletonlabs/skeleton';
	import { getContext, onDestroy, onMount } from 'svelte';
	import { zod } from 'sveltekit-superforms/adapters';
	import scrollStore from '$lib/stores/scroll-store';
	import type { Unsubscriber, Writable } from 'svelte/store';
	import { roleTranslation } from '$lib/authorization';

	let loginForm: SuperValidated<z.infer<typeof loginSchema>> | undefined;
	let logoutForm: HTMLFormElement;
	let inLandingPage = false;
	let scrollStoreUnsub: Unsubscriber;
	let userStoreUnsub: Unsubscriber;
	let showHeader = false;
	let loginBtn: HTMLButtonElement | undefined;
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');

	$: inLandingPage = $page.url.pathname === '/' && (!$userStore || $userStore.isPatient);

	onMount(async () => {
		let lastScroll = 0;
		scrollStoreUnsub = scrollStore.subscribe((scrollTop) => {
			if (lastScroll < 88 && scrollTop >= 88) {
				showHeader = true;
			}
			if (lastScroll >= 88 && scrollTop < 88) {
				showHeader = false;
			}
			lastScroll = scrollTop;
		});

		userStoreUnsub = userStore.subscribe(async (userB) => {
			if (!userB && !loginForm) {
				loginForm = await superValidate(zod(loginSchema));
			}
		});
	});

	onDestroy(() => {
		scrollStoreUnsub?.();
		userStoreUnsub?.();
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

<div
	class="fixed w-full pr-scroll-bar z-10 {inLandingPage && !showHeader
		? '-translate-y-24'
		: ''} transition-transform duration-300 ease-out"
>
	<AppBar
		background={inLandingPage ? 'px-4' : 'bg-white'}
		padding={inLandingPage ? 'py-4' : 'py-6'}
		slotLead="h-10"
		slotDefault="flex justify-center gap-8 h-10"
		regionRowMain="container px-4 mx-auto bg-white rounded-container-token {inLandingPage
			? 'py-2 border shadow-lg'
			: 'py-0'}"
	>
		<svelte:fragment slot="lead">
			<a href="/" class="px-3">
				<img class={inLandingPage ? 'h-10' : 'h-12'} src="/images/prodental.png" alt="" />
			</a>
		</svelte:fragment>
		<a href="#" class="group pt-1">
			<div class="flex flex-col h-8 justify-end">
				<p
					class="leading-5 text-sm group-hover:pb-1 font-bold text-black/60 group-hover:text-black transition-all duration-160 ease-out px-2 uppercase tracking-wider"
				>
					Dịch vụ
				</p>
				<div
					class="bg-primary-500 h-1 transition-all duration-200 ease-out w-0 group-hover:w-full"
				></div>
			</div>
		</a>
		<a href="#" class="group pt-1">
			<div class="flex flex-col h-8 justify-end">
				<p
					class="leading-5 text-sm group-hover:pb-1 font-bold text-black/60 group-hover:text-black transition-all duration-160 ease-out px-2 uppercase tracking-wider"
				>
					Tư vấn
				</p>
				<div
					class="bg-primary-500 h-1 transition-all duration-200 ease-out w-0 group-hover:w-full"
				></div>
			</div>
		</a>
		<a href="#" class="group pt-1">
			<div class="flex flex-col h-8 justify-end">
				<p
					class="leading-5 text-sm group-hover:pb-1 font-bold text-black/60 group-hover:text-black transition-all duration-160 ease-out px-2 uppercase tracking-wider"
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
				<Dialog.Root
					preventScroll={false}
					onOpenChange={onLoginModalOpenChange}
					open={!!$page.state.loginModal}
				>
					<Dialog.Trigger asChild let:builder>
						<button
							class="btn bg-gradient-to-br from-primary-500 text-sm to-cyan-400 text-white font-semibold px-6 py-2"
							bind:this={loginBtn}
							use:builder.action
							{...builder}
						>
							Đăng nhập
						</button>
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
				<DropdownMenu.Root preventScroll={true}>
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
						class="w-full max-w-[229px] rounded-md border border-surface-100 bg-white p-1 shadow-lg z-10"
					>
						<DropdownMenu.Label class="text-center select-none text-xs p-1 font-bold">
							{$userStore.roles.map((x) => roleTranslation[x]).join(', ')}
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
{#if inLandingPage}
	<div class="h-[88px] w-full absolute top-0 z-0">
		<div class="container mx-auto px-4 my-6 flex items-center gap-16 h-10">
			<div class="px-3">
				<img class="h-12" src="/images/prodental-white.png" alt="" />
			</div>
			<a href="#" class="group hover:drop-shadow-md">
				<div class="flex flex-col h-8 justify-end relative">
					<p
						class="leading-5 text-white text-lg pb-1 font-medium transition-all duration-160 ease-out uppercase"
					>
						Dịch vụ
					</p>
					<div
						class="bg-white h-0.5 transition-all duration-200 ease-out w-0 group-hover:w-full"
					></div>
				</div>
			</a>
			<a href="#" class="group hover:drop-shadow-md">
				<div class="flex flex-col h-8 justify-end relative">
					<p
						class="leading-5 text-white text-lg pb-1 font-medium transition-all duration-160 ease-out uppercase"
					>
						Tư vấn
					</p>
					<div
						class="bg-white h-0.5 transition-all duration-200 ease-out w-0 group-hover:w-full"
					></div>
				</div>
			</a>
			<a href="#" class="group hover:drop-shadow-md">
				<div class="flex flex-col h-8 justify-end relative">
					<p
						class="leading-5 text-white text-lg pb-1 font-medium transition-all duration-160 ease-out uppercase"
					>
						Về chúng tôi
					</p>
					<div
						class="bg-white h-0.5 transition-all duration-200 ease-out w-0 group-hover:w-full"
					></div>
				</div>
			</a>
		</div>
		<button
			type="button"
			class="absolute shadow-md flex gap-2 right-0 btn rounded-r-none text-white text-lg top-1/2 -translate-y-1/2 bg-gradient-to-r from-sky-800 to-teal-800"
			on:click={() => loginBtn?.click()}
		>
			<i class="fa-regular fa-right-to-bracket"></i>
			<span class="uppercase">Đăng nhập</span>
		</button>
	</div>
{/if}
