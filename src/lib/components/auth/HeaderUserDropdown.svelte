<script lang="ts">
	import { Role, roleTranslation } from '$lib/authorization';
	import { DropdownMenu } from 'bits-ui';
	import { createEventDispatcher } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	export let userAuth: UserBasic;
	export let inLandingHeader = false;

	const dispatch = createEventDispatcher<{ logout: undefined }>();
</script>

<DropdownMenu.Root preventScroll={true}>
	<DropdownMenu.Trigger
		class="overflow-x-hidden {inLandingHeader
			? 'h-12 w-56 px-3 absolute right-0 top-1/2 -translate-y-1/2 rounded-l-full border border-tertiary-700 variant-filled-tertiary hover:bg-white hover:border-surface-300'
			: 'h-10 w-40 px-[10px] rounded-full variant-outline hover:variant-outline-primary'} ring-surface-200 transition-all duration-300 hover:text-primary-500 flex items-center"
	>
		<i class="fa-solid fa-circle-user {inLandingHeader ? 'text-2xl' : 'text-xl'}"></i>
		<span class="ml-2 {inLandingHeader ? 'text-base' : 'text-sm'} text-ellipsis overflow-x-hidden"
			>{userAuth.email}</span
		>
		{#if inLandingHeader}
			<div class="w-10 shrink-0 text-xl">
				<i class="fa-solid fa-ellipsis-vertical"></i>
			</div>
		{/if}
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
			{userAuth.roles.map((x) => roleTranslation[x]).join(', ')}
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
		{#if userAuth.roles.includes(Role.Patient)}
			<DropdownMenu.Item
				href="/appointments"
				class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-3 rounded select-none flex gap-3 items-center"
			>
				<div class="size-4 text-center">
					<i class="fa-solid fa-calendar-days block"></i>
				</div>
				<span class="font-semibold text-sm leading-4">Lịch hẹn</span>
			</DropdownMenu.Item>
		{/if}
		<DropdownMenu.Separator class="my-1 -ml-1 -mr-1 block h-px bg-surface-50" />
		<DropdownMenu.Item
			on:click={() => dispatch('logout')}
			class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
		>
			<div class="size-4 text-center">
				<i class="fa-solid fa-right-from-bracket block"></i>
			</div>
			<span class="font-semibold text-sm leading-4">Đăng xuất</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
