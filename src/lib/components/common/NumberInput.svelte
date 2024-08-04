<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface $$Props extends Omit<HTMLInputAttributes, 'class' | 'type' | 'value'> {
		value?: number;
		step?: number;
		min?: number;
		max?: number;
	}

	export let value = 0;
	export let step = 1;
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;
</script>

<div class="relative">
	<input
		type="number"
		class="input rounded-container-token px-12 text-center w-36 font-medium"
		bind:value
		{...$$restProps}
	/>
	<div class="absolute top-0 bottom-0 left-0 w-10 border-r border-surface-300">
		<button
			type="button"
			class="w-full h-full btn p-0 rounded-none"
			on:click={() => {
				if (min) {
					value = Math.max(min, value - step);
				} else {
					value -= step;
				}
			}}
		>
			<i class="fa-solid fa-minus"></i>
		</button>
	</div>
	<div class="absolute top-0 bottom-0 right-0 w-10 border-l border-surface-300">
		<button
			type="button"
			class="w-full h-full btn p-0 rounded-none"
			on:click={() => {
				if (max) {
					value = Math.min(max, value + step);
				} else {
					value += step;
				}
			}}
		>
			<i class="fa-solid fa-plus"></i>
		</button>
	</div>
</div>
