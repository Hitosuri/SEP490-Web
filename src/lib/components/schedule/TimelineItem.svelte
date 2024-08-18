<script lang="ts">
	import {
		ScheduleStatus,
		scheduleStatusInfo,
		scheduleStepInHour,
		scheduleStepInMinute
	} from '$lib/constants/schedule-constant';
	import { formatCompactDate, formatHourMinute } from '$lib/helpers/formatters';
	import { Tooltip } from 'bits-ui';
	import { createEventDispatcher } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	export let schedule: ScheduleFull;
	export let placeholder = false;
	export let stepWidth = 32;

	$: leftOffset =
		schedule.startAt.getHours() / scheduleStepInHour +
		schedule.startAt.getMinutes() / scheduleStepInMinute;
	$: width = Math.max(
		schedule.status === ScheduleStatus.PENDING || !schedule.endAt
			? 1
			: schedule.endAt.getHours() / scheduleStepInHour +
					schedule.endAt.getMinutes() / scheduleStepInMinute -
					leftOffset,
		0
	);
	$: widthInPx = width * stepWidth;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="h-full py-0.5 absolute top-0 overflow-hidden group z-[2]"
	style="left: {leftOffset * stepWidth}px; width: {widthInPx}px"
	id="schedule-{schedule.id}"
>
	{#if !placeholder}
		<Tooltip.Root openDelay={500}>
			<Tooltip.Trigger asChild let:builder={triggerBuilder}>
				<div
					{...triggerBuilder}
					use:triggerBuilder.action
					class="border rounded-md h-full flex overflow-hidden relative {widthInPx >= 4
						? 'border-l-4'
						: ''} {(scheduleStatusInfo[schedule.status]?.styleClasses ?? []).join(' ')}"
				>
					{#if widthInPx > 64}
						<div class="flex-1 flex flex-col justify-center px-3 select-text w-full gap-1">
							<p
								class="overflow-hidden tracking-tighter text-ellipsis whitespace-nowrap {schedule
									.patient.name
									? 'text-black font-medium'
									: 'text-warning-500'}"
							>
								{schedule.patient.name ?? 'Chưa có tên'}
							</p>
							<p
								class="text-xs font-semibold tracking-tighter text-surface-400 whitespace-nowrap overflow-hidden text-ellipsis"
							>
								{formatHourMinute(schedule.startAt)}
								-
								{formatHourMinute(schedule.endAt) || '...'}
							</p>
						</div>
					{:else}
						<div
							class="flex items-center font-bold justify-center flex-1 pointer-events-none select-none"
						>
							{schedule.order + 1}
						</div>
					{/if}
				</div>
			</Tooltip.Trigger>
			<Tooltip.Content
				transition={fly}
				transitionConfig={{
					duration: 200,
					y: 30,
					easing: cubicOut
				}}
				sideOffset={8}
				class="shadow-md text-sm z-20 px-4 py-3 border rounded-md bg-white leading-6"
			>
				<p>
					<span>Bệnh nhân:</span>
					<span class={!schedule.patient.name ? 'text-warning-500' : 'font-semibold tracking-wide'}
						>{schedule.patient.name}</span
					>
				</p>
				<p>
					<span>Bác sĩ:</span>
					<span class="font-semibold tracking-wide">{schedule.doctor.name}</span>
				</p>
				<p>
					<span>Thời gian khám:</span>
					<span class="font-semibold tracking-wide">
						{formatHourMinute(schedule.startAt)}
						-
						{formatHourMinute(schedule.endAt) || '...'}
					</span>
				</p>
				<p>
					<span>Ngày khám:</span>
					<span class="font-semibold tracking-wide">{formatCompactDate(schedule.startAt)}</span>
				</p>
				<p>
					<span>Mô tả:</span>
					<span class="tracking-wide">{schedule.description ?? ''}</span>
				</p>
				<Tooltip.Arrow class="border-l border-t" />
			</Tooltip.Content>
		</Tooltip.Root>
	{:else}
		<div class="border-2 border-primary-500 border-dashed h-full rounded-md"></div>
	{/if}
</div>
