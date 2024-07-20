<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface $$Props extends Omit<HTMLInputAttributes, 'class' | 'type' | 'value'> {
		value?: number;
	}

	export let value = 0;
</script>

<div class="relative">
	<input
		type="number"
		class="input rounded-container-token px-12 text-center w-36 font-medium"
		bind:value
		{...$$restProps}
	/>
	<div class="absolute top-0 bottom-0 left-0 w-10 border-r border-surface-300">
		<button type="button" class="w-full h-full btn p-0 rounded-none" on:click={() => value--}>
			<i class="fa-solid fa-minus"></i>
		</button>
	</div>
	<div class="absolute top-0 bottom-0 right-0 w-10 border-l border-surface-300">
		<button type="button" class="w-full h-full btn p-0 rounded-none" on:click={() => value++}>
			<i class="fa-solid fa-plus"></i>
		</button>
	</div>
</div>
