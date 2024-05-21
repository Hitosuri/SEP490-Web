<script lang="ts">
	import { pushState } from '$app/navigation';
	import LoginForm from '$lib/components/LoginForm.svelte';
	import { Dialog } from 'bits-ui';
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { page } from '$app/stores';
	import type { loginSchema } from '$lib/form-schemas/login-schema';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { z } from 'zod';
	import { enhance } from '$app/forms';
	import userStore from '$lib/stores/user-store';

	export let loginForm: SuperValidated<z.infer<typeof loginSchema>>;

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

<div class="bg-white transition-all shadow-xl fixed w-full top-0 left-0">
	<div class="flex py-6 container mx-auto">
		<a href="/">
			<h2 class="h2 font-semibold">Hello</h2>
		</a>
		<div class="ml-auto flex gap-2">
			<a href="/protected" class="anchor btn">Protected</a>
			{#if !$userStore && $page.url.pathname !== '/auth/login'}
				<Dialog.Root onOpenChange={onLoginModalOpenChange} open={!!$page.state.loginModal}>
					<Dialog.Trigger
						class="btn variant-ringed-primary font-semibold px-6 py-2 text-primary-500 hover:bg-primary-500/10 transition-all"
					>
						Đăng nhập
					</Dialog.Trigger>
					<Dialog.Portal>
						<Dialog.Overlay
							transition={fade}
							transitionConfig={{ duration: 150 }}
							class="fixed inset-0 z-50 bg-black/80"
						/>
						<Dialog.Content
							transition={scale}
							transitionConfig={{ easing: cubicOut }}
							class="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full sm:w-5/6 md:w-3/4 lg:w-3/5 xl:w-1/2 2xl:w-[720px] px-4"
						>
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
						</Dialog.Content>
					</Dialog.Portal>
				</Dialog.Root>
			{/if}
			{#if $userStore}
				<form action="/auth?/logout" method="post" use:enhance>
					<button class="btn variant-filled-primary font-semibold px-6 py-2">Đăng xuất</button>
				</form>
			{/if}
		</div>
	</div>
</div>
