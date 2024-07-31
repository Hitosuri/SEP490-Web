<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	interface $$Props extends HTMLAttributes<HTMLDivElement> {
		paddingTopHeader?: boolean;
		heightFull?: boolean;
		heightScreenMin?: boolean;
	}

	export let paddingTopHeader = false;
	export let heightFull = false;
	export let heightScreenMin = false;

	$: ({ class: inputClasses, ...others } = $$restProps);
</script>

<div
	class="container-content{heightScreenMin ? ' min-h-screen' : ''}{paddingTopHeader
		? ' pt-header'
		: ''}{heightFull ? ' h-full' : ''}"
>
	<div class="area-content {inputClasses}" {...others}>
		<slot />
	</div>
</div>

<style lang="postcss">
	.container-content {
		display: grid;
		grid-template-areas: 'left content right';
		grid-template-columns: 1fr minmax(0, 1400px) 1fr;
	}

	.area-content {
		grid-area: content;
		padding-left: 1rem;
		padding-right: 1rem;
	}
</style>
