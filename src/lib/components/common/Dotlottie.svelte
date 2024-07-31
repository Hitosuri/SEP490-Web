<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import debounce from 'debounce';
	import { DotLottie, type Mode, type RenderConfig } from '@lottiefiles/dotlottie-web';
	import type { HTMLAttributes } from 'svelte/elements';

	interface $$Props extends HTMLAttributes<HTMLDivElement> {
		autoplay?: boolean;
		backgroundColor?: string;
		data?: string | ArrayBuffer;
		loop?: boolean;
		mode?: Mode;
		renderConfig?: RenderConfig;
		segment?: [number, number];
		speed?: number;
		src?: string;
		useFrameInterpolation?: boolean;
		autoResizeCanvas?: boolean;
		dotLottieRefCallback?: (dotLottie: DotLottie) => void;
	}

	export let autoplay = false;
	export let backgroundColor: string | undefined = undefined;
	export let data: string | ArrayBuffer | undefined = undefined;
	export let loop = false;
	export let mode: Mode = 'forward';
	export let renderConfig: RenderConfig | undefined = undefined;
	export let segment: [number, number] | undefined = undefined;
	export let speed = 1;
	export let src: string | undefined = undefined;
	export let useFrameInterpolation = true;
	export let autoResizeCanvas = false;
	export let dotLottieRefCallback: ((dotLottie: DotLottie) => void) | undefined = undefined;

	let dotLottie: DotLottie | undefined;
	let canvas: HTMLCanvasElement;
	let prevSrc: string | ArrayBuffer | undefined;
	let prevData: string | ArrayBuffer | undefined;
	let resizeObserver: ResizeObserver | undefined;
	let intersectionObserver: IntersectionObserver | undefined;

	$: {
		if (dotLottie && dotLottie.isLoaded && typeof speed == 'number') {
			dotLottie.setSpeed(speed);
		}
	}
	$: {
		if (dotLottie && dotLottie.isLoaded && typeof useFrameInterpolation == 'boolean') {
			dotLottie.setUseFrameInterpolation(useFrameInterpolation);
		}
	}
	$: {
		if (
			dotLottie &&
			dotLottie.isLoaded &&
			Array.isArray(segment) &&
			segment.length === 2 &&
			typeof segment[0] === 'number' &&
			typeof segment[1] === 'number'
		) {
			let [start, end] = segment;
			dotLottie.setSegment(start, end);
		}
	}
	$: {
		if (dotLottie && dotLottie.isLoaded && typeof loop == 'boolean') {
			dotLottie.setLoop(loop);
		}
	}
	$: {
		if (dotLottie) {
			dotLottie.setBackgroundColor(backgroundColor || '');
		}
	}
	$: {
		if (dotLottie && dotLottie.isLoaded && typeof mode == 'string') {
			dotLottie.setMode(mode);
		}
	}
	$: if (dotLottie && src !== prevSrc) {
		dotLottie.load({
			src,
			autoplay,
			loop,
			speed,
			data,
			renderConfig,
			segment,
			useFrameInterpolation,
			backgroundColor,
			mode
		});
		prevSrc = src;
	}
	$: if (dotLottie && data !== prevData) {
		dotLottie.load({
			src,
			autoplay,
			loop,
			speed,
			data,
			renderConfig,
			segment,
			useFrameInterpolation,
			backgroundColor,
			mode
		});
		prevData = data;
	}

	onMount(() => {
		dotLottie = new DotLottie({
			canvas,
			src,
			autoplay,
			loop,
			speed,
			data,
			renderConfig,
			segment,
			useFrameInterpolation,
			backgroundColor,
			mode
		});
		if (dotLottieRefCallback) {
			dotLottieRefCallback(dotLottie);
		}
		const resizeObserver = new ResizeObserver(
			debounce(() => {
				if (autoResizeCanvas) {
					dotLottie?.resize();
				}
			}, 150)
		);
		const intersectionObserver = new IntersectionObserver(
			debounce((entries: IntersectionObserverEntry[]) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						dotLottie?.unfreeze();
					} else {
						dotLottie?.freeze();
					}
				});
			}, 150),
			{ threshold: 0 }
		);
		if (autoResizeCanvas) {
			resizeObserver.observe(canvas);
		}
		intersectionObserver.observe(canvas);
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		intersectionObserver?.disconnect();
		dotLottie?.destroy();
	});
</script>

<div {...$$restProps}>
	<canvas bind:this={canvas} class="block w-full h-full object-contain"></canvas>
</div>
