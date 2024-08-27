<script lang="ts">
	export let value: boolean | undefined = undefined;
	export let indeterminate = false;

	let checboxState: [true, false, undefined] = [true, false, undefined];
	let currentState: number = checboxState.findIndex((x) => x === value);
</script>

<button
	type="button"
	class="checkbox text-sm text-white {checboxState[currentState] !== false
		? 'bg-primary-500 border-none'
		: 'bg-white'}"
	on:click={() => {
		currentState = (currentState + 1) % (indeterminate ? 3 : 2);
		value = checboxState[currentState];
	}}
>
	{#if checboxState[currentState] === undefined}
		<i class="fa-solid fa-minus"></i>
	{:else if checboxState[currentState]}
		<i class="fa-solid fa-check"></i>
	{/if}
</button>
