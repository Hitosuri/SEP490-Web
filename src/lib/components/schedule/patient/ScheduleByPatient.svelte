<script lang="ts">
	import { Calendar, ContextMenu, DropdownMenu, type Selected } from 'bits-ui';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import TimelineItem from '../TimelineItem.svelte';
	import { today, getLocalTimeZone, type DateValue } from '@internationalized/date';
	import SearchCombobox from '$lib/components/common/SearchCombobox.svelte';
	import endpoints from '$lib/endpoints';
	import { getContext, onDestroy, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import CreateAppoimentByPatient from './CreateAppoimentByPatient.svelte';
	import { createAppointmentPatientSchema } from '$lib/form-schemas/create-appointment-patient-schema';
	import { z } from 'zod';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { formatCompactDate, formatCompactDateTime } from '$lib/helpers/formatters';
	import { toast } from 'svelte-sonner';
	import EditAppoimentByPatient from './EditAppoimentByPatient.svelte';
	import Container from '$lib/components/common/Container.svelte';
	import { MinuteTick } from '$lib/helpers/minute-tick';

	export let allSchedule: ScheduleByPatient[];
	export let patientSchedules: ScheduleFull[];

	export let currentMonthValue: number;
	export let createAppointmentByPatientForm: SuperValidated<
		z.infer<typeof createAppointmentPatientSchema>
	>;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const modalStore = getModalStore();
	let scheduleListElement: HTMLDivElement;
	let scheduleMenuOpened = false;
	let scheduleGrabing = false;
	let mouseAnchor: { x: number; y: number };
	let scheduleScroll: { x: number; y: number };
	let selectedDate: DateValue = today(getLocalTimeZone());
	let addingDoctor: Selected<UserMinimal> | undefined;
	let selectionInDoctor: UserMinimal | undefined;
	let scheduleHovering = false;
	let quarterCount = 0;
	let rowCount = 0;
	let hoverHintTop = 0;
	let canCreateSchedule = true;
	let limitEndElement: HTMLDivElement;
	let currentMinute: Date = new Date();

	$: lowerLimit = calculateLowerLimit(selectedDate);
	$: blockPastWidth = lowerLimit * 32;
	$: selectedDateSchedules = allSchedule.filter((x) => x.startAt.getDate() === selectedDate.day);
	$: waitConfirmSchedules = patientSchedules.filter((x) => x.status === 1);
	$: scheduleByDoctors = extractScheduleByDoctor(selectedDateSchedules);
	$: blockRangeByDoctors = scheduleByDoctors.map((x) =>
		x[1].map(
			(y) =>
				[
					y.startAt.getHours() * 4 + y.startAt.getMinutes() / 15,
					y.endAt.getHours() * 4 + y.endAt.getMinutes() / 15
				] as [number, number]
		)
	);
	$: canCreateSchedule =
		quarterCount >= lowerLimit &&
		!blockRangeByDoctors[rowCount]?.some((x) => quarterCount >= x[0] && quarterCount < x[1]);
	$: hoverHintTop = rowCount * 64;
	$: hoverHintLeft = (quarterCount + 2) * 32;
	$: hoveringHours = Math.floor(quarterCount / 4);
	$: hoveringMinutes = (quarterCount % 4) * 15;

	onMount(() => {
		MinuteTick.addEvent(calculateLowerLimitActive);
	});

	onDestroy(() => {
		MinuteTick.removeEvent(calculateLowerLimitActive);
	});

	function calculateLowerLimitActive(time: Date) {
		currentMinute = time;
		lowerLimit = calculateLowerLimit(selectedDate);
	}

	function calculateLowerLimit(date: DateValue): number {
		const result = date.compare(today(getLocalTimeZone()));

		if (result < 0) {
			return 96;
		} else if (result > 0) {
			return 0;
		} else {
			const now = new Date();
			return now.getHours() * 4 + Math.ceil(now.getMinutes() / 15);
		}
	}

	function scrollToLimitEnd() {
		if (!limitEndElement) {
			return;
		}

		limitEndElement.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
			inline: 'center'
		});
	}

	function deleteSchedule(schedule: ScheduleFull) {
		const modalSetting: ModalSettings = {
			type: 'confirm',
			title: 'Xác nhận huỷ lịch',
			body: `Bác có chắc muốn huỷ lịch vào lúc ${schedule.startAt.getHours()}:${String(schedule.startAt.getMinutes()).padStart(2, '0')} - ${formatCompactDate(schedule.startAt)}`,
			response: (r) => {
				if (!r || !$userStore) {
					return;
				}

				toast.promise(
					async (): Promise<string> => {
						const response = await fetch(endpoints.schedule.deleteByPatient(schedule.id), {
							method: 'DELETE',
							headers: {
								'content-type': 'application/json',
								Authorization: `Bearer ${$userStore.token}`
							}
						});

						if (!response.ok) {
							const data = await response.json();
							if (typeof data?.error === 'string') {
								return Promise.reject(data?.error);
							} else if (Array.isArray(data?.error) || Array.isArray(data)) {
								const msg = (data?.error ?? data).join(', ');
								return Promise.reject(msg);
							}

							return Promise.reject();
						}
						filtering();
						return 'Xoá lịch hẹn thành công';
					},
					{
						loading: 'Đang xử lý...',
						success: (msg) => msg ?? 'Xoá lịch hẹn thành công',
						error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình xoá lịch hẹn'
					}
				);
			}
		};
		modalStore.trigger(modalSetting);
	}

	function extractScheduleByDoctor(
		schedules: ScheduleByPatient[]
	): [UserMinimal, ScheduleByPatient[]][] {
		const doctors: Record<number, [UserMinimal, ScheduleByPatient[]]> = {};

		schedules.forEach((s) => {
			const doctorId = s.doctor.id;
			if (!doctors[doctorId]) {
				doctors[doctorId] = [s.doctor, [s]];
				return;
			}

			doctors[doctorId][1].push(s);
		});

		return Object.values(doctors);
	}

	async function searchDoctorFn(keyword: string): Promise<Selected<UserMinimal>[] | undefined> {
		if (!$userStore) {
			return;
		}

		const searchParams = new URLSearchParams();
		searchParams.set('size', '5');
		searchParams.set('query', keyword);

		const url = `${endpoints.users.doctorSearch}?${searchParams}`;
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${$userStore.token}`
			}
		});

		if (!response.ok) {
			return;
		}

		const data: ApiResponse<UserMinimal[]> = await response.json();

		if (!data.body) {
			return;
		}

		return data.body.map((x) => ({
			label: x.name ?? '',
			value: x
		}));
	}

	function addDoctorSubmit() {
		if (!addingDoctor || scheduleByDoctors.some((x) => x[0].id === addingDoctor?.value.id)) {
			return;
		}

		scheduleByDoctors = [
			...scheduleByDoctors,
			[
				{
					id: addingDoctor.value.id,
					name: addingDoctor.value.name
				},
				[]
			]
		];
		addingDoctor = undefined;
	}

	async function onSelectedDateChange(date: DateValue | DateValue[] | undefined) {
		if (!date || (Array.isArray(date) && date.length === 0)) {
			return;
		}
		const selectedDateTmp = Array.isArray(date) ? date[0] : date;
		if (selectedDateTmp.year * 100 + selectedDateTmp.month !== currentMonthValue) {
			await filtering(selectedDateTmp.month);
		}
		selectedDate = selectedDateTmp;
	}

	async function filtering(month: number | undefined = undefined) {
		if (!$userStore) {
			return;
		}

		const filterOptionsExtended: Record<string, string | boolean | undefined> = {
			page: '1',
			size: '1000',
			startAt: `${selectedDate.year}-${month ?? selectedDate.month}-1`,
			endAt: `${selectedDate.year}-${(month ?? selectedDate.month) + 1}-1`
		};

		const currentMonthValueTmp = selectedDate.year * 100 + (month ?? selectedDate.month);
		const searchParams = new URLSearchParams();

		Object.keys(filterOptionsExtended).forEach((key) => {
			if (filterOptionsExtended[key] === undefined) {
				return;
			}
			searchParams.set(key, String(filterOptionsExtended[key]));
		});

		try {
			const [allScheduleData, scheduleOfPatientData] = await Promise.all([
				fetch(`${endpoints.schedule.getByPatient}?${searchParams}`, {
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				}).then<Pagination<ScheduleByPatient[]> | undefined>((x) => (x.ok ? x.json() : undefined)),
				fetch(`${endpoints.schedule.getOwnByPatient}?${searchParams}`, {
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				}).then<Pagination<ScheduleFull[]> | undefined>((x) => (x.ok ? x.json() : undefined))
			]);

			let pendingSchedules: number[] = [];
			if (scheduleOfPatientData) {
				scheduleOfPatientData.data.forEach((x, i) => {
					x.order = i;
					x.startAt = new Date(x.startAt);
					x.endAt = x.endAt ? new Date(x.endAt) : undefined;
				});
				pendingSchedules = scheduleOfPatientData.data
					.filter((x) => x.status === 1)
					.map((x) => x.id);

				patientSchedules = scheduleOfPatientData.data;
			}

			if (allScheduleData) {
				allScheduleData.data = allScheduleData.data.filter((x) => !pendingSchedules.includes(x.id));
				allScheduleData.data.forEach((x) => {
					x.startAt = new Date(x.startAt);
					x.endAt = new Date(x.endAt);
				});

				allSchedule = allScheduleData.data;
			}

			currentMonthValue = currentMonthValueTmp;
		} catch (error) {
			console.log(error);
		}
	}

	function scheduleDragStart(e: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		if (scheduleByDoctors.length === 0 || scheduleMenuOpened) {
			return;
		}

		mouseAnchor = { x: e.x, y: e.y };
		scheduleScroll = {
			x: scheduleListElement.scrollLeft,
			y: scheduleListElement.scrollTop
		};
		selectionInDoctor = scheduleByDoctors[rowCount][0];
		scheduleGrabing = true;
	}

	function scheduleDragging(e: MouseEvent & { currentTarget: EventTarget & Window }) {
		if (!scheduleGrabing) {
			return;
		}

		scheduleListElement.scrollTop = mouseAnchor.y - e.y + scheduleScroll.y;
		scheduleListElement.scrollLeft = mouseAnchor.x - e.x + scheduleScroll.x;

		if (
			scheduleListElement.scrollLeft === 0 ||
			scheduleListElement.scrollLeft ===
				scheduleListElement.scrollWidth - scheduleListElement.clientWidth
		) {
			scheduleScroll.x = scheduleListElement.scrollLeft;
			mouseAnchor.x = e.x;
		}
		if (
			scheduleListElement.scrollTop === 0 ||
			scheduleListElement.scrollTop ===
				scheduleListElement.scrollHeight - scheduleListElement.clientHeight
		) {
			scheduleScroll.y = scheduleListElement.scrollTop;
			mouseAnchor.y = e.y;
		}
	}

	function scheduleDragEnd() {
		scheduleGrabing = false;
	}

	function createAppointment() {
		if (!selectionInDoctor) {
			return;
		}

		const startHour = Math.floor(quarterCount / 4);
		const startMinute = (quarterCount % 4) * 15;
		const setting: ModalSettings = {
			type: 'component',
			component: {
				ref: CreateAppoimentByPatient,
				props: {
					createAppointmentByPatientForm,
					startHour,
					startMinute,
					date: selectedDate.toDate(getLocalTimeZone()),
					doctor: selectionInDoctor
				}
			},
			response: (r) => {
				if (r) {
					cancelCreateSchedule();
					filtering();
					return;
				}
				scheduleMenuOpened = true;
			}
		};
		modalStore.trigger(setting);
	}

	function editAppointment(schedule: ScheduleFull) {
		const setting: ModalSettings = {
			type: 'component',
			component: {
				ref: EditAppoimentByPatient,
				props: {
					schedule,
					createAppointmentByPatientForm
				}
			},
			response: (r) => {
				if (r) {
					cancelCreateSchedule();
					filtering();
					return;
				}
				scheduleMenuOpened = true;
			}
		};
		modalStore.trigger(setting);
	}

	function cancelCreateSchedule() {
		selectionInDoctor = undefined;
	}
</script>

<svelte:head>
	<title>Danh sách lịch hẹn</title>
</svelte:head>
<svelte:window on:mousemove={scheduleDragging} on:mouseup={scheduleDragEnd} />
<Container paddingTopHeader class="space-y-8 py-4">
	{#if waitConfirmSchedules.length > 0}
		<div>
			<div class="flex items-center gap-2 text-base sm:text-xl md:text-2xl font-light mb-4">
				<span class="text-surface-500">Lịch hẹn chờ phòng khám xác nhận</span>
				<hr class="flex-1 !border-surface-400" />
				<span class="text-surface-600">tháng {selectedDate.month}</span>
			</div>
			<div class="flex flex-wrap gap-4">
				{#each waitConfirmSchedules as schedule (schedule.id)}
					<div
						class="bg-white border pl-3 sm:pl-5 pr-1 sm:pr-3 py-2 sm:py-3 shadow-md rounded-md flex items-center gap-4 bg-"
					>
						<div>
							<p class="text-xs sm:text-sm font-bold text-surface-400">
								{formatCompactDateTime(schedule.startAt)}
							</p>
							<p class="text-sm sm:text-base font-medium">Bs. {schedule.doctor.name}</p>
						</div>
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
										on:click={() => editAppointment(schedule)}
										class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 data-[disabled]:pointer-events-none data-[disabled]:text-surface-300 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
									>
										<div class="size-4 text-center *:block">
											<i class="fa-regular fa-calendar-lines-pen"></i>
										</div>
										<span class="font-semibold text-sm leading-4">Sửa lịch hẹn</span>
									</DropdownMenu.Item>
									<DropdownMenu.Item
										disabled={schedule.startAt.getTime() - currentMinute.getTime() < 1000 * 60 * 60}
										on:click={() => deleteSchedule(schedule)}
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
					</div>
				{/each}
			</div>
		</div>
	{/if}
	<div>
		<div class="flex items-center gap-2 text-base sm:text-xl md:text-2xl font-light">
			<span class="text-surface-500">Lịch hẹn theo ngày / Tạo lịch</span>
			<hr class="flex-1 !border-surface-400" />
		</div>
		<div>
			<Calendar.Root
				locale="vi"
				class="rounded-container-token sm:p-4 w-full"
				let:months
				let:weekdays
				preventDeselect={true}
				value={selectedDate}
				onValueChange={onSelectedDateChange}
			>
				<Calendar.Header class="flex items-center justify-between h-10">
					<Calendar.PrevButton
						class="btn btn-sm sm:btn-base variant-ghost-tertiary rounded-md px-4 sm:px-8"
					>
						<i class="fa-solid fa-chevron-left"></i>
					</Calendar.PrevButton>
					<Calendar.Heading
						class="text-sm sm:text-lg font-semibold text-surface-500 capitalize tracking-tight"
					/>
					<Calendar.NextButton
						class="btn btn-sm sm:btn-base variant-ghost-tertiary rounded-md px-4 sm:px-8"
					>
						<i class="fa-solid fa-chevron-right"></i>
					</Calendar.NextButton>
				</Calendar.Header>

				<div
					class="flex flex-col space-y-4 py-3 sm:pt-4 sm:pb-0 sm:flex-row sm:space-x-4 sm:space-y-0"
				>
					{#each months as month}
						<Calendar.Grid class="w-full border-collapse select-none space-y-1">
							<Calendar.GridHead>
								<Calendar.GridRow class="mb-1 flex w-full justify-between">
									{#each weekdays as day}
										<Calendar.HeadCell
											class="flex-1 rounded-md text-xs text-surface-400 font-medium"
										>
											<div>{day.slice(0, 2)}</div>
										</Calendar.HeadCell>
									{/each}
								</Calendar.GridRow>
							</Calendar.GridHead>
							<Calendar.GridBody>
								{#each month.weeks as weekDates}
									<Calendar.GridRow class="flex w-full gap-2 justify-between">
										{#each weekDates as date}
											<Calendar.Cell
												{date}
												class="relative flex-1 h-8 max-w-10 sm:max-w-full sm:h-10 !p-0 text-center my-1"
											>
												<Calendar.Day
													{date}
													month={month.value}
													class="group relative font-medium inline-flex w-full h-full items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-transparent p-0 text-foreground transition-all hover:border-primary-700 data-[disabled]:pointer-events-none data-[outside-month]:pointer-events-none data-[selected]:bg-primary-200 data-[selected]:font-semibold data-[selected]:text-primary-700 data-[disabled]:text-surface-300 data-[unavailable]:text-surface-300 data-[unavailable]:line-through text-sm sm:text-base"
												>
													<div
														class="absolute top-[5px] hidden size-1 rounded-full bg-primary-400 transition-all group-data-[today]:block"
													/>
													{date.day}
												</Calendar.Day>
											</Calendar.Cell>
										{/each}
									</Calendar.GridRow>
								{/each}
							</Calendar.GridBody>
						</Calendar.Grid>
					{/each}
				</div>
			</Calendar.Root>
		</div>
		<div class="bg-white border shadow-md rounded-container-token p-4 flex-1 h-fit">
			<div
				bind:this={scheduleListElement}
				class="min-h-56 {scheduleMenuOpened
					? 'overflow-hidden pr-scroll-bar pb-scroll-bar'
					: 'overflow-x-scroll'} {scheduleGrabing ? 'select-none' : ''}"
			>
				<div class="h-fit w-fit pl-32 sm:pl-40">
					<div
						class="sticky left-32 sm:left-40 -translate-x-32 sm:sssssssssssssssssssssssssssssssssss-translate-x-40 w-32 sm:w-40 h-0 z-20"
					>
						<div class="w-full h-fit absolute top-0 left-0 bg-slate-50 border-r">
							<div
								class="text-center h-10 leading-10 sticky top-0 left-0 border-b-2 bg-slate-50 text-sm font-semibold"
							>
								Bác sĩ
							</div>
							{#each scheduleByDoctors as pair (pair[0].id)}
								<div class="h-16 border-b flex items-center justify-center">{pair[0].name}</div>
							{/each}
							<div class="h-[42px] relative">
								<form
									class="absolute left-0 top-0 -right-16 border-b flex items-center justify-center h-full text-sm"
									on:submit|preventDefault|stopPropagation={addDoctorSubmit}
								>
									{#key scheduleByDoctors}
										<SearchCombobox
											placeholder="Tên bác sĩ..."
											searchFn={searchDoctorFn}
											regionInput="border-none bg-white w-full py-2 text-sm sm:text-base"
											bind:selected={addingDoctor}
											let:itemData
										></SearchCombobox>
									{/key}
									<button
										disabled={!addingDoctor}
										type="submit"
										class="btn variant-filled-primary h-full w-16 flex-shrink-0 rounded-none"
									>
										<i class="fa-solid fa-plus"></i>
									</button>
								</form>
							</div>
						</div>
					</div>
					<div class="bg-slate-50 sticky border-b-2 -translate-y-10 top-10 h-10 w-fit flex z-10">
						{#each Array(25) as _, i}
							<div class="shrink-0 text-center leading-10 text-sm select-none font-semibold w-32">
								<p>{i}:00</p>
							</div>
						{/each}
					</div>
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div
						class="h-fit relative"
						on:mousedown={scheduleDragStart}
						on:mouseenter={() => {
							if (scheduleByDoctors.length === 0) {
								return;
							}
							scheduleHovering = true;
						}}
						on:mouseleave={() => (scheduleHovering = false)}
						on:mousemove={(e) => {
							const bounding = e.currentTarget.getBoundingClientRect();
							if (scheduleMenuOpened) {
								return;
							}
							quarterCount = Math.min(
								Math.max(Math.floor((e.clientX - bounding.left - 62) / 32), 0),
								96
							);
							rowCount = Math.max(
								Math.min(Math.floor((e.clientY - bounding.top) / 64), scheduleByDoctors.length - 1),
								0
							);
						}}
					>
						<div class="absolute left-0 top-0 bottom-0 w-full flex *:h-full">
							<div class="w-16 bg-surface-50 untouchable pointer-events-none"></div>
							{#each Array(24) as _}
								<div class="w-32 shrink-0 border-r"></div>
							{/each}
							<div class="w-16 bg-surface-50 untouchable pointer-events-none"></div>
						</div>
						<div
							class="h-16 w-8 absolute z-10 top-0 {(scheduleHovering && canCreateSchedule) ||
							scheduleMenuOpened
								? 'opacity-100'
								: 'opacity-0 pointer-events-none'}"
							style="left: {hoverHintLeft}px; top: {hoverHintTop}px;"
						>
							<ContextMenu.Root bind:open={scheduleMenuOpened}>
								<ContextMenu.Trigger class="h-full w-full px-0.5 py-2">
									<div
										class="bg-red-300 rounded-md h-full w-full mr-auto cursor-pointer shadow-md"
									></div>
								</ContextMenu.Trigger>

								<ContextMenu.Content
									transition={fly}
									transitionConfig={{
										duration: 200,
										y: 30,
										easing: cubicOut
									}}
									class="w-full max-w-32 sm:max-w-40 rounded-md border border-surface-100 bg-white p-1 shadow-lg z-10"
								>
									<ContextMenu.Item
										on:click={createAppointment}
										class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
									>
										<div class="size-4 text-center *:block">
											<i class="fa-regular fa-calendar-check"></i>
										</div>
										<span class="font-semibold text-sm leading-4">Tạo lịch hẹn</span>
									</ContextMenu.Item>
									<ContextMenu.Item
										on:click={cancelCreateSchedule}
										class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
									>
										<div class="size-4 text-center *:block">
											<i class="fa-regular fa-circle-xmark"></i>
										</div>
										<span class="font-semibold text-sm leading-4">Huỷ</span>
									</ContextMenu.Item>
								</ContextMenu.Content>
							</ContextMenu.Root>
							<div
								class="absolute z-20 text-center -top-11 left-1/2 shadow-md text-tertiary-600 text-sm font-semibold -translate-x-1/2 px-2 py-1 border rounded-md bg-white"
							>
								{hoveringHours}:{String(hoveringMinutes).padStart(2, '0')}
							</div>
						</div>
						<div class="pl-16 w-full relative">
							<div
								on:dblclick={scrollToLimitEnd}
								class="w-10 untouchable absolute top-0 left-16 bottom-0 z-[1]"
								style="width: {blockPastWidth}px;"
							>
								<div class="w-0 ml-auto" bind:this={limitEndElement}></div>
							</div>
							{#each scheduleByDoctors as pair (pair[0].id)}
								<div class="h-16 w-full border-b border-dashed relative">
									{#each pair[1] as schedule (schedule.id)}
										{@const leftOffset =
											(schedule.startAt.getHours() + schedule.startAt.getMinutes() / 60) * 128}
										{@const width = Math.max(
											(schedule.endAt.getHours() + schedule.endAt.getMinutes() / 60) * 128 -
												leftOffset,
											0
										)}
										{@const ownSchedule = patientSchedules.find((x) => x.id === schedule.id)}
										{#if !ownSchedule}
											<div
												class="h-full bg-red-400 absolute top-0 overflow-hidden untouchable"
												style="left: {leftOffset}px; width: {width}px"
												id="schedule-{schedule.id}"
											></div>
										{:else if ownSchedule.status !== 1}
											<TimelineItem schedule={ownSchedule} />
										{/if}
									{/each}
								</div>
							{/each}
							<div class="h-[42px] border-b"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</Container>
