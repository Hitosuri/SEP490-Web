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
	import { AppBar } from '@skeletonlabs/skeleton';
	import { getContext, onDestroy, onMount } from 'svelte';
	import { zod } from 'sveltekit-superforms/adapters';
	import scrollStore from '$lib/stores/scroll-store';
	import type { Readable, Unsubscriber, Writable } from 'svelte/store';
	import HeaderUserDropdown from '../auth/HeaderUserDropdown.svelte';
	import Container from '../common/Container.svelte';

	let sideBarActive = getContext<Writable<boolean>>('sidebar-active');
	let sideBarOpened = getContext<Readable<boolean>>('sidebar-state');
	let loginForm: SuperValidated<z.infer<typeof loginSchema>> | undefined;
	let logoutForm: HTMLFormElement;
	let inLandingPage = false;
	let inAuth = false;
	let scrollStoreUnsub: Unsubscriber;
	let userStoreUnsub: Unsubscriber;
	let showHeader = false;
	let loginBtn: HTMLButtonElement | undefined;
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const scrollCap = 88;
	const shadowCap = 88;
	const shadowMaxVal = [10, 15, -3, 4, 6, -4];
	let shadowVal = [0, 0, 0, 0, 0, 0];

	$: isStaff = $userStore && !$userStore.isPatient;
	$: inLandingPage = $page.url.pathname === '/' && !isStaff;
	$: inAuth = $page.url.pathname.startsWith('/auth');

	onMount(async () => {
		let lastScroll = 0;
		scrollStoreUnsub = scrollStore.subscribe((scrollTop) => {
			if (lastScroll < scrollCap && scrollTop >= scrollCap) {
				showHeader = true;
			}
			if (lastScroll >= scrollCap && scrollTop < scrollCap) {
				showHeader = false;
			}
			if (inLandingPage && shadowVal[0] !== 0) {
				shadowVal = [0, 0, 0, 0, 0, 0];
			} else if (scrollTop < shadowCap) {
				shadowVal = shadowMaxVal.map((x) => Math.min(1, scrollTop / shadowCap) * x);
			} else if (lastScroll < shadowCap && scrollTop >= shadowCap) {
				shadowVal = shadowMaxVal;
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

	function illegalLogout() {
		logoutForm.requestSubmit();
	}
</script>

<div
	class="fixed top-0 right-0 shadow shadow-black/15 z-10 {$sideBarOpened && !inAuth
		? 'left-side-bar'
		: 'left-0'} {inLandingPage && !showHeader ? '-translate-y-24' : 'translate-y-0'} {inLandingPage
		? 'py-4 transition-transform'
		: 'py-6 bg-white'} pr-scroll-bar-dynamic transition-[left] duration-300 ease-out"
	style="--tw-shadow-colored: 0 {shadowVal[0]}px {shadowVal[1]}px {shadowVal[2]}px var(--tw-shadow-color), 0 {shadowVal[3]}px {shadowVal[4]}px {shadowVal[5]}px var(--tw-shadow-color); --tw-shadow: var(--tw-shadow-colored)"
>
	<Container>
		<AppBar
			background={inLandingPage ? '' : 'bg-white'}
			padding="p-0"
			slotLead="h-10 transition-opacity duration-300 {$sideBarOpened
				? 'opacity-0 pointer-events-none'
				: 'opacity-100'}"
			slotDefault="flex justify-center gap-8 h-10"
			regionRowMain="w-full bg-white rounded-container-token {inLandingPage
				? 'px-4 py-2 border shadow-lg'
				: 'py-0'}"
		>
			<svelte:fragment slot="lead">
				{#if !inLandingPage && !inAuth && !$userStore?.isPatient}
					<button
						type="button"
						class="btn-icon size-10 text-2xl mr-4 transition-all hover:bg-surface-200 hover:text-surface-700 text-surface-500"
						on:click={() => ($sideBarActive = true)}
					>
						<i class="fa-solid fa-bars-sort"></i>
					</button>
				{/if}
				<a href="/" class="px-3">
					<img class={inLandingPage ? 'h-10' : 'h-12'} src="/images/prodental.png" alt="" />
				</a>
			</svelte:fragment>
			<!-- <a href="#" class="group pt-1">
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
			</a> -->
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
					<HeaderUserDropdown userAuth={$userStore} on:logout={illegalLogout} />
				{/if}
				<form action="/auth?/logout" hidden method="post" use:enhance bind:this={logoutForm}></form>
			</svelte:fragment>
		</AppBar>
	</Container>
</div>
{#if inLandingPage}
	<div class="h-header w-full absolute top-0 z-0">
		<Container class="flex my-6 items-center gap-16 h-10">
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
		</Container>
		{#if $userStore}
			<HeaderUserDropdown userAuth={$userStore} inLandingHeader on:logout={illegalLogout} />
		{:else}
			<button
				type="button"
				class="absolute shadow-md flex gap-2 right-0 btn rounded-r-none text-white text-lg top-1/2 -translate-y-1/2 bg-gradient-to-r from-sky-800 to-teal-800"
				on:click={() => loginBtn?.click()}
			>
				<i class="fa-regular fa-right-to-bracket"></i>
				<span class="uppercase">Đăng nhập</span>
			</button>
		{/if}
	</div>
{/if}
