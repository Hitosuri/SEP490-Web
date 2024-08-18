<script lang="ts">
	import { ScheduleStatus, scheduleStatusInfo } from '$lib/constants/schedule-constant';
	import { formatHourMinute } from '$lib/helpers/formatters';
	import { DropdownMenu } from 'bits-ui';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { MinuteTick } from '$lib/helpers/minute-tick';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

	export let selectedDateSchedules: ScheduleFull[];
	export let scrollToSchedule: ((schedule: ScheduleFull) => void) | undefined = undefined;

	const dispatch = createEventDispatcher<{
		confirm: ScheduleFull;
		checkin: ScheduleFull;
		edit: ScheduleFull;
		cancel: ScheduleFull;
		delete: ScheduleFull;
	}>();
	const actions: {
		label: string;
		shortLabel: string;
		icon: string;
		availableWhen: (schedule: ScheduleFull, currentTime: Date) => boolean;
		event: 'confirm' | 'checkin' | 'edit' | 'cancel' | 'delete';
	}[] = [
		{
			label: 'Xác nhận lịch tạo bởi bệnh nhân',
			shortLabel: 'Xác nhận',
			icon: 'fa-regular fa-handshake',
			availableWhen: (schedule) => schedule.status === ScheduleStatus.PENDING,
			event: 'confirm'
		},
		{
			label: 'Bệnh nhân đã tới phòng khám',
			shortLabel: 'Check-in',
			icon: 'fa-solid fa-check-to-slot',
			availableWhen: (schedule, time) =>
				schedule.status === ScheduleStatus.CONFIRMED &&
				time.getTime() <=
					schedule.startAt.getTime() +
						((schedule.endAt ?? schedule.startAt).getTime() - schedule.startAt.getTime()) / 3 &&
				time.getHours() >= 7 &&
				time.getHours() < 23 &&
				schedule.startAt.toLocaleDateString() === time.toLocaleDateString(),
			event: 'checkin'
		},
		{
			label: 'Huỷ lịch do bệnh nhân không tới',
			shortLabel: 'Huỷ',
			icon: 'fa-regular fa-calendar-circle-minus',
			availableWhen: (schedule, time) =>
				schedule.status === ScheduleStatus.PENDING ||
				(schedule.status == ScheduleStatus.CONFIRMED && time > schedule.startAt),
			event: 'cancel'
		},
		{
			label: 'Sửa lịch hẹn',
			shortLabel: 'Sửa',
			icon: 'fa-regular fa-calendar-lines-pen',
			availableWhen: (schedule, time) =>
				schedule.status !== ScheduleStatus.CANCEL && !!schedule.endAt && schedule.endAt > time,
			event: 'edit'
		},
		{
			label: 'Xoá lịch hẹn',
			shortLabel: 'Xoá',
			icon: 'fa-regular fa-trash-can',
			availableWhen: (schedule, time) =>
				(schedule.status === ScheduleStatus.PENDING ||
					schedule.status == ScheduleStatus.CONFIRMED) &&
				(!schedule.endAt || time < schedule.endAt),
			event: 'delete'
		}
	];
	let currentMinute: Date = new Date();

	onMount(() => {
		MinuteTick.addEvent(setCurrentMinute);
	});

	onDestroy(() => {
		MinuteTick.removeEvent(setCurrentMinute);
	});

	function setCurrentMinute(time: Date) {
		currentMinute = time;
	}
</script>

<div
	class="bg-white border shadow-md rounded-container-token p-4 flex-1 flex flex-col h-[19.25rem] *:grid-cols-[3rem_1fr_8rem_1fr_max(6rem,12%)_max(7rem,18%)_7.5rem] relative"
>
	<slot />
	<div
		class="grid pb-2 border-b font-semibold text-sm text-surface-400 tracking-wide pr-scroll-bar"
	>
		<span class="text-center">#</span>
		<span class="text-center whitespace-nowrap">Bệnh nhân</span>
		<span class="text-center whitespace-nowrap">Thời gian</span>
		<span class="text-center whitespace-nowrap">Bác sĩ</span>
		<span class="text-center whitespace-nowrap">Trạng thái</span>
		<span class="text-center">BN đã xác nhận</span>
		<span></span>
	</div>
	<div class="grid overflow-y-scroll flex-1 items-center content-start">
		{#each selectedDateSchedules as schedule, i (schedule.id)}
			{@const odd = i % 2 === 0}
			{@const firstAction = actions.find((x) => x.availableWhen(schedule, currentMinute))}
			<div class="text-center pt-1.5 h-full {odd ? '' : 'bg-slate-50'} schedule-row-{schedule.id}">
				<button
					class="btn rounded-none hover:underline font-medium"
					on:click={() => scrollToSchedule?.(schedule)}>{schedule.order + 1}</button
				>
			</div>
			<div
				class="text-center h-full flex flex-col items-center justify-center {odd
					? ''
					: 'bg-slate-50'} schedule-row-{schedule.id}"
			>
				<a
					href="/patients/{schedule.patient.id}"
					class="hover:underline {!schedule.patient.name ? 'text-warning-500' : 'font-medium'}"
				>
					{schedule.patient.name ?? 'Chưa có tên'}
				</a>
				<p class="text-xs text-surface-400">{schedule.patient.phone ?? ''}</p>
			</div>
			<div
				class="py-3.5 text-center flex items-center justify-center h-full {odd
					? ''
					: 'bg-slate-50'} schedule-row-{schedule.id}"
			>
				<span class="badge variant-soft-tertiary">
					{formatHourMinute(schedule.startAt)}
				</span>
				-
				<span class="badge variant-soft-tertiary">
					{formatHourMinute(schedule.endAt) || '...'}
				</span>
			</div>
			<span class="py-3.5 h-full text-center {odd ? '' : 'bg-slate-50'} schedule-row-{schedule.id}"
				>{schedule.doctor.name}</span
			>
			<div
				class="py-3.5 h-full text-center flex justify-center items-center {odd
					? ''
					: 'bg-slate-50'}"
			>
				<span
					class="{(scheduleStatusInfo[schedule.status]?.styleClasses ?? []).join(
						' '
					)} border px-2 py-1 rounded-full w-fit text-sm font-medium tracking-tight"
				>
					{scheduleStatusInfo[schedule.status]?.label ?? ''}
				</span>
			</div>
			<div
				class="py-3.5 h-full text-center flex items-center justify-center {odd
					? ''
					: 'bg-slate-50'}"
			>
				<input
					type="checkbox"
					checked={schedule.isPatientConfirm}
					class="checkbox pointer-events-none bg-white"
				/>
			</div>
			<div
				class="h-full flex items-center justify-end {odd
					? ''
					: 'bg-slate-50'} schedule-row-{schedule.id}"
			>
				{#if firstAction}
					<button
						type="button"
						class="variant-filled-primary py-1 px-2 rounded-l-md border-r text-sm font-medium"
						on:click={() => dispatch(firstAction.event, schedule)}>{firstAction.shortLabel}</button
					>
				{:else}
					<button
						type="button"
						class="variant-filled-surface py-1 px-4 rounded-l-md border-r text-sm"
					>
						<i class="fa-solid fa-ban"></i>
					</button>
				{/if}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="{firstAction
							? 'variant-filled-primary'
							: 'variant-filled-surface'} py-1 px-2 rounded-r-md group mr-1.5 text-sm"
					>
						<i class="fa-solid fa-chevron-down group-data-[state=open]:rotate-180 transition-all"
						></i>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						transition={fly}
						transitionConfig={{
							duration: 200,
							y: 30,
							easing: cubicOut
						}}
						class="w-fit rounded-md border border-surface-100 bg-white p-1 shadow-lg z-10"
					>
						{#each actions as action}
							<DropdownMenu.Item
								disabled={!action.availableWhen(schedule, currentMinute)}
								on:click={() => dispatch(action.event, schedule)}
								class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 data-[disabled]:pointer-events-none data-[disabled]:text-surface-300 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
							>
								<div class="size-4 text-center *:block flex justify-center">
									<i class={action.icon}></i>
								</div>
								<span class="font-semibold text-sm leading-4">{action.label}</span>
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		{/each}
	</div>
</div>
