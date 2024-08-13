<script lang="ts">
	import { ScheduleStatus, scheduleStatusInfo } from '$lib/constants/schedule-constant';
	import { formatHourMinute } from '$lib/helpers/formatters';
	import { createEventDispatcher } from 'svelte';

	export let schedule: ScheduleFull;
	export let placeholder = false;

	const dispatch = createEventDispatcher<{
		hoverStart: number;
		hoverEnd: number;
	}>();

	$: leftOffset = schedule.startAt.getHours() + schedule.startAt.getMinutes() / 60;
	$: width = Math.max(
		schedule.status === ScheduleStatus.PENDING || !schedule.endAt
			? 0.25
			: schedule.endAt.getHours() + schedule.endAt.getMinutes() / 60 - leftOffset,
		0
	);
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="h-full p-0.5 absolute top-0 overflow-hidden group z-[2]"
	style="left: {leftOffset * 128}px; width: {width * 128}px"
	id="schedule-{schedule.id}"
	on:mouseenter={() => dispatch('hoverStart', schedule.id)}
	on:mouseleave={() => dispatch('hoverEnd', schedule.id)}
>
	{#if !placeholder}
		<div
			class="border rounded-md h-full flex overflow-hidden relative border-l-4 {(
				scheduleStatusInfo[schedule.status]?.styleClasses ?? []
			).join(' ')}"
		>
			{#if width * 4 > 2}
				<div class="flex-1 flex flex-col justify-center px-3 select-text w-full gap-1">
					<p class="font-medium overflow-hidden text-ellipsis whitespace-nowrap text-black">
						{schedule.patient.name}
					</p>
					<p class="text-xs font-semibold text-surface-400">
						{formatHourMinute(schedule.startAt)}
						-
						{formatHourMinute(schedule.endAt) || '...'}
					</p>
				</div>
			{:else}
				<div class="flex items-center font-bold justify-center flex-1">{schedule.order + 1}</div>
			{/if}
		</div>
	{:else}
		<div class="border-2 border-primary-500 border-dashed h-full rounded-md"></div>
	{/if}
</div>
