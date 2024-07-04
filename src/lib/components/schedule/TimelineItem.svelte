<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let schedule: ScheduleByRecieptionist;

	const leftOffset = (schedule.startAt.getHours() + schedule.startAt.getMinutes() / 60) * 128;
	const width = (schedule.endAt.getHours() + schedule.endAt.getMinutes() / 60) * 128 - leftOffset;
	const colors = {
		1: ['bg-warning-100', 'border-warning-200', 'bg-warning-400'],
		2: ['bg-success-100', 'border-success-200', 'bg-success-400'],
		3: ['bg-stone-200', 'border-stone-200', 'bg-stone-400']
	} as const;
	const dispatch = createEventDispatcher<{
		hoverStart: number;
		hoverEnd: number;
	}>();
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="h-full p-0.5 absolute top-0 overflow-hidden group"
	style="left: {leftOffset}px; width: {width}px"
	id="schedule-{schedule.id}"
	on:mouseenter={() => dispatch('hoverStart', schedule.id)}
	on:mouseleave={() => dispatch('hoverEnd', schedule.id)}
>
	<div
		class="border rounded-md h-full flex overflow-hidden relative {colors[
			schedule.status
		][0]} {colors[schedule.status][1]}"
	>
		<div class="{colors[schedule.status][2]} w-1"></div>
		{#if width > 64}
			<div class="flex-1 flex flex-col justify-center px-3 select-text w-full gap-1">
				<p class="font-medium overflow-hidden text-ellipsis whitespace-nowrap">
					{schedule.patient.name}
				</p>
				<p class="text-xs font-semibold text-surface-400">
					{schedule.startAt.getHours()}:{String(schedule.startAt.getMinutes()).padStart(2, '0')}
					-
					{schedule.endAt.getHours()}:{String(schedule.endAt.getMinutes()).padStart(2, '0')}
				</p>
			</div>
		{:else}
			<div class="flex items-center font-bold justify-center flex-1">{schedule.order + 1}</div>
		{/if}
	</div>
</div>
