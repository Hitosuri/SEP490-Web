<script lang="ts">
	import { formatCurrency, formatFullDate } from '$lib/helpers/formatters';

	export let profile: Profile;
</script>

<div class="grid grid-cols-2 gap-y-6 py-4 px-6 gap-x-8">
	<div class="flex gap-4">
		<div
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg"
		>
			<i class="fa-solid fa-user"></i>
		</div>
		<div>
			<p class="text-sm font-semibold text-surface-500 select-none">Họ và tên</p>
			<p class="text-xl font-medium tracking-wide">{profile.name}</p>
		</div>
	</div>
	<div class="flex gap-4">
		<div
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg"
		>
			<i class="fa-solid fa-at"></i>
		</div>
		<div>
			<p class="text-sm font-semibold text-surface-500 select-none">Email</p>
			<p class="text-xl font-medium tracking-wide">{profile.email}</p>
		</div>
	</div>
	<div class="flex gap-4">
		<div
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg"
		>
			<i class="fa-solid fa-phone"></i>
		</div>
		<div>
			<p class="text-sm font-semibold text-surface-500 select-none">Số điện thoại</p>
			<p class="text-xl font-medium tracking-wide">{profile.phone}</p>
		</div>
	</div>
	<div class="flex gap-4">
		<div
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg"
		>
			<i class="fa-solid fa-cake-candles"></i>
		</div>
		<div>
			<p class="text-sm font-semibold text-surface-500 select-none">Ngày sinh</p>
			<p class="text-xl font-medium tracking-wide">{formatFullDate(profile.birthday)}</p>
		</div>
	</div>
	<div class="flex gap-4">
		<div
			class="size-12 text-center h-fit bg-surface-700 text-white text-xl leading-[48px] rounded-tl-lg rounded-br-lg"
		>
			<i class="fa-solid fa-hand-holding-circle-dollar"></i>
		</div>
		<div>
			<p class="text-sm font-semibold text-surface-500 select-none">Lương</p>
			<p class="text-xl font-medium tracking-wide">{formatCurrency(profile.salary)}</p>
		</div>
	</div>
</div>
