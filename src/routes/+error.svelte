<script lang="ts">
	import { page } from '$app/stores';
	import Dotlottie from '$lib/components/common/Dotlottie.svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let errorTypes: {
		title?: string;
		description?: string;
		image: string;
		dotlottieClasses: HTMLAttributes<HTMLDivElement>['class'];
		textWrapperClasses: HTMLAttributes<HTMLDivElement>['class'];
		condition: (status: number) => boolean;
	}[] = [
		{
			title: 'Trang bạn tìm kiếm không tồn tại',
			image: '/images/animations/404.lottie',
			dotlottieClasses: '-mt-[10%]',
			textWrapperClasses: 'top-[84%]',
			condition: (x) => x === 404
		},
		{
			title: 'Bạn không thể truy cập trang này',
			image: '/images/animations/4xx.lottie',
			dotlottieClasses: '-mt-[10%]',
			textWrapperClasses: 'top-[66%]',
			condition: (x) => x === 403
		},
		{
			title: 'Bạn không có quyền truy cập trang này',
			image: '/images/animations/401.lottie',
			dotlottieClasses: '-mt-[15%]',
			textWrapperClasses: 'top-full',
			condition: (x) => x === 401
		},
		{
			image: '/images/animations/5xx.lottie',
			dotlottieClasses: '-mt-[10%]',
			textWrapperClasses: 'top-full',
			condition: (x) => x >= 500
		},
		{
			image: '/images/animations/4xx.lottie',
			dotlottieClasses: '-mt-[10%]',
			textWrapperClasses: 'top-[66%]',
			condition: (x) => x >= 400
		}
	];
	let currentError = errorTypes.find((x) => x.condition($page.status));
</script>

<div class="p-4 h-full flex items-center">
	<div class="relative w-full">
		{#if currentError}
			<Dotlottie
				class="w-[800px] max-w-full {currentError.dotlottieClasses} mx-auto"
				src={currentError.image}
				autoResizeCanvas
				autoplay
			/>
			<div class="text-center absolute {currentError.textWrapperClasses} w-full">
				<h2
					class="text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-error-500"
				>
					{currentError.title ?? `Đã xảy ra lỗi ${$page.status}`}
				</h2>
				<p class="mt-4 text-sm md:text-base lg:text-lg text-surface-500">
					{currentError.description ?? $page.error?.message}
				</p>
				<a href="/" class="btn btn-sm md:btn-base variant-filled-secondary font-medium mt-4">
					<i class="fa-solid fa-arrow-left mr-4"></i>
					Trở về trang chủ
				</a>
			</div>
		{/if}
	</div>
</div>
