<script lang="ts">
	import { scheduleStatusInfo } from '$lib/constants/schedule-constant';
	import endpoints from '$lib/endpoints';
	import { formatCompactDateTime } from '$lib/helpers/formatters';
	import { handleToastFetch } from '$lib/helpers/utils';
	import { DropdownMenu } from 'bits-ui';
	import { createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	export let schedule: ScheduleFull;
	export let currentMinute: Date;

	const dispatch = createEventDispatcher<{
		scroll: ScheduleFull;
		edit: ScheduleFull;
		delete: ScheduleFull;
		reload: undefined;
	}>();

	function confirmNewSchedule(schedule: ScheduleFull) {
		toast.promise(
			handleToastFetch(
				fetch(endpoints.schedule.confirmFromPatient(schedule.token, true), {
					method: 'PUT',
					headers: {
						'content-type': 'application/json'
					}
				}),
				{ success: 'Xác nhận lịch hẹn thành công' },
				() => {
					dispatch('reload');
				}
			),
			{
				loading: 'Đang xử lý...',
				success: (msg) => msg ?? 'Xác nhận lịch hẹn thành công',
				error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình xác nhận lịch hẹn mới'
			}
		);
	}

	function rejectNewSchedule(schedule: ScheduleFull) {
		toast.promise(
			handleToastFetch(
				fetch(endpoints.schedule.confirmFromPatient(schedule.token, false), {
					method: 'PUT',
					headers: {
						'content-type': 'application/json'
					}
				}),
				{ success: 'Từ chối lịch hẹn thành công' },
				() => {
					dispatch('reload');
				}
			),
			{
				loading: 'Đang xử lý...',
				success: (msg) => msg ?? 'Từ chối lịch hẹn thành công',
				error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình từ chối lịch hẹn mới'
			}
		);
	}
</script>

<div
	class="bg-white border pr-1 pt-5 pb-3 mt-3.5 shadow-md rounded-container-token items-center gap-4 relative"
>
	<div class="flex justify-between gap-4">
		<div class="flex items-center gap-4">
			<button
				type="button"
				class="font-bold text-success-800 rounded-r pr-2 pl-4 py-1 bg-slate-200 text-sm"
				on:click={() => dispatch('scroll', schedule)}
			>
				{schedule.order + 1}
			</button>
			<div>
				<p class="text-xs sm:text-sm font-bold text-surface-400">
					{formatCompactDateTime(schedule.startAt)}
				</p>
				<p class="text-sm sm:text-base font-medium">Bs. {schedule.doctor.name}</p>
			</div>
		</div>
		{#if schedule.isPatientConfirm}
			<div>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class="btn-icon size-9 hover:variant-soft-primary">
						<i class="fa-solid fa-ellipsis-vertical"></i>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						transition={fly}
						transitionConfig={{
							duration: 200,
							y: 30,
							easing: cubicOut
						}}
						class="w-full max-w-40 rounded-md border border-surface-100 bg-white p-1 shadow-lg"
					>
						<DropdownMenu.Item
							on:click={() => dispatch('edit', schedule)}
							class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 data-[disabled]:pointer-events-none data-[disabled]:text-surface-300 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
						>
							<div class="size-4 text-center *:block">
								<i class="fa-regular fa-calendar-lines-pen"></i>
							</div>
							<span class="font-semibold text-sm leading-4">Sửa lịch hẹn</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							disabled={schedule.startAt.getTime() < currentMinute.getTime()}
							on:click={() => dispatch('delete', schedule)}
							class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 data-[disabled]:pointer-events-none data-[disabled]:text-surface-300 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
						>
							<div class="size-4 text-center *:block">
								<i class="fa-regular fa-calendar-circle-minus"></i>
							</div>
							<span class="font-semibold text-sm leading-4">Xoá lịch</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		{/if}
	</div>
	<div class="absolute left-1/2 -top-3.5 -translate-x-1/2 select-none">
		<div
			class="{(scheduleStatusInfo[schedule.status]?.styleClasses ?? []).join(
				' '
			)} badge border tracking-tight"
		>
			{scheduleStatusInfo[schedule.status]?.label ?? ''}
		</div>
	</div>
	{#if !schedule.isPatientConfirm}
		<div class="mt-3 px-4">
			<p class="font-medium text-sm">
				Thời gian khám đã được thay đổi,
				<br />
				vui lòng kiểm tra lại
			</p>
			<div class="flex gap-4 mt-2 ml-1 font-medium *:btn *:btn-sm *:rounded-md">
				<button
					type="button"
					class="variant-filled-error"
					on:click={() => rejectNewSchedule(schedule)}
				>
					<i class="fa-solid fa-cancel"></i>
					<span class="pl-1">Từ chối</span>
				</button>
				<button
					type="button"
					class="variant-filled-primary"
					on:click={() => confirmNewSchedule(schedule)}
				>
					<i class="fa-solid fa-check"></i>
					<span class="pl-1">Đồng ý</span>
				</button>
			</div>
		</div>
	{/if}
</div>
