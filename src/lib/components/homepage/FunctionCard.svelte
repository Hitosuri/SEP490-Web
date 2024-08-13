<script lang="ts">
	import { DotLottie } from '@lottiefiles/dotlottie-web';
	import { twMerge } from 'tailwind-merge';
	import { onMount } from 'svelte';

	interface $$Props {
		lottieAnimUrl: string;
		title: string;
		class?: string | null | undefined;
		href?: string | null | undefined;
	}

	export let lottieAnimUrl: string;
	export let title: string;
	export let href: string | null | undefined = undefined;

	let lottieAnim: DotLottie | undefined;
	let tag = href ? 'a' : 'div';

	onMount(async () => {
		const defineElement = (await import('@lordicon/element')).defineElement;
		const lottie = (await import('lottie-web')).default;
		defineElement(lottie.loadAnimation);
	});

	function dotLottieRefCallback(dotLottie: DotLottie) {
		lottieAnim = dotLottie;
	}

	// function onMouseEnter() {
	// 	lottieAnim?.setLoop(true);
	// 	if (!lottieAnim?.isPlaying) {
	// 		lottieAnim?.play();
	// 	}
	// }

	// function onMouseLeave() {
	// 	lottieAnim?.setLoop(false);
	// }
</script>

<svelte:element
	this={tag}
	class={twMerge(
		'flex-1 select-none bg-gradient-to-br hover:shadow-lg hover:scale-[102%] transition-all duration-300 ease-out rounded-lg flex flex-col items-center p-4 gap-3 cursor-pointer relative overflow-hidden z-0',
		$$restProps.class ?? ''
	)}
	role="link"
	tabindex="-9999"
	{...href ? { href } : {}}
>
	<div class="size-36 p-2 bg-white/30 rounded-full z-10 drop-shadow">
		<lord-icon trigger="hover" src={lottieAnimUrl.slice(0, -6) + 'json'} class="size-32" />
	</div>
	<!-- <Dotlottie
		class="size-36 p-2 max-w-full bg-white/30 rounded-full z-10 drop-shadow"
		src={lottieAnimUrl}
		autoResizeCanvas
		autoplay
		{dotLottieRefCallback}
	/> -->
	<p
		class="font-semibold w-full tracking-wide z-10 text-white drop-shadow-xl uppercase text-center relative"
	>
		{title}
	</p>
	<div
		class="w-[160%] h-0 top-4 right-2 pt-[160%] absolute pointer-events-none rounded-full bg-gradient-to-b from-white/15 to-transparent"
	></div>
	<div
		class="w-[120%] h-0 -top-[12%] left-[70%] pt-[120%] absolute pointer-events-none rounded-full bg-gradient-to-b from-white/10 to-transparent"
	></div>
</svelte:element>
