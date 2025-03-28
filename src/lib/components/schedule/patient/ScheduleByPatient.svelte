<script lang="ts">
	import { Calendar, ContextMenu, DropdownMenu, Slider, type Selected } from 'bits-ui';
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
	import {
		ScheduleStatus,
		scheduleStepInHour,
		scheduleStepInMinute,
		scheduleStatusInfo
	} from '$lib/constants/schedule-constant';
	import {
		getDayValue,
		handleToastFetch,
		normalizeStartEnd,
		normalizeTime
	} from '$lib/helpers/utils';
	import ScheduleCard from './ScheduleCard.svelte';

	export let allSchedule: ScheduleByPatient[];
	export let patientSchedules: ScheduleFull[];
	export let applications: Application[];
	export let currentMonthValue: number;
	export let createAppointmentByPatientForm: SuperValidated<
		z.infer<typeof createAppointmentPatientSchema>
	>;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const modalStore = getModalStore();
	const upperLimit = 23 / scheduleStepInHour;
	const baseStepWidth = 32;
	const doctorColumnWidth = 160;
	let scheduleListElement: HTMLDivElement;
	let scheduleMenuOpened = false;
	let scheduleGrabing = false;
	let mouseAnchor: { x: number; y: number };
	let scheduleScroll: { x: number; y: number };
	let selectedDate: DateValue = today(getLocalTimeZone());
	let addingDoctor: Selected<User> | undefined;
	let selectionInDoctor: UserMinimal | undefined;
	let scheduleHovering = false;
	let quarterCount = 0;
	let rowCount = 0;
	let hoverHintTop = 0;
	let canCreateSchedule = true;
	let limitEndElement: HTMLDivElement;
	let currentMinute: Date = new Date();
	let stepWidth = baseStepWidth;

	$: hourWidth = stepWidth * 4;
	$: lowerLimit = calculateLowerLimit(selectedDate);
	$: blockPastWidth = lowerLimit * stepWidth;
	$: selectedDateSchedules = allSchedule.filter((x) => x.startAt.getDate() === selectedDate.day);
	$: waitConfirmSchedules = patientSchedules.filter(
		(x) =>
			x.status === ScheduleStatus.PENDING ||
			(x.status === ScheduleStatus.CONFIRMED && !x.isPatientConfirm && currentMinute < x.startAt)
	);
	$: scheduleByDoctors = extractScheduleByDoctor(selectedDateSchedules);
	$: ({ 1: blockRangeByDoctors, 2: blockRangeByApplications } = calculateBlockRange(
		scheduleByDoctors,
		applications,
		selectedDate
	));
	$: canCreateSchedule =
		quarterCount >= lowerLimit &&
		quarterCount < upperLimit &&
		!blockRangeByDoctors[rowCount]?.some((x) => quarterCount >= x[0] && quarterCount < x[1]);
	$: hoverHintTop = rowCount * 64;
	$: hoverHintLeft = quarterCount * stepWidth + 40;
	$: hoveringHours = Math.floor(quarterCount / 4);
	$: hoveringMinutes = (quarterCount % 4) * 15;

	onMount(() => {
		MinuteTick.addEvent(calculateLowerLimitActive);
	});

	onDestroy(() => {
		MinuteTick.removeEvent(calculateLowerLimitActive);
	});

	function calculateBlockRange(
		scheduleByDoctors: [UserMinimal, ScheduleByPatient[]][],
		applications: Application[],
		selectedDate: DateValue
	) {
		const g = scheduleByDoctors.map((x) => {
			const currentDayValue = getDayValue(selectedDate.toDate(getLocalTimeZone()));
			const doctorApplications: [number, number][] = [];
			applications
				.filter((y) => y.userId === x[0].id)
				.forEach((y) => {
					const startDayValue = getDayValue(y.startAt);
					const endDayValue = getDayValue(y.endAt);

					if (startDayValue === currentDayValue && endDayValue === currentDayValue) {
						doctorApplications.push(normalizeStartEnd(y.startAt, y.endAt));
					} else if (startDayValue === currentDayValue) {
						doctorApplications.push([normalizeTime(y.startAt), 24 / scheduleStepInHour]);
					} else if (endDayValue === currentDayValue) {
						doctorApplications.push([0, normalizeTime(y.startAt)]);
					}
				});

			return {
				1: x[0].id,
				2: x[1].map((y) => normalizeStartEnd(y.startAt, y.endAt)).concat(doctorApplications),
				3: doctorApplications
			};
		});
		return {
			1: g.map((x) => x[2]),
			2: g.reduce(
				(prev, curr) => {
					prev[curr[1]] = curr[3];
					return prev;
				},
				{} as Record<number, [number, number][]>
			)
		};
	}

	function calculateLowerLimitActive(time: Date) {
		currentMinute = time;
		lowerLimit = calculateLowerLimit(selectedDate);
	}

	function calculateLowerLimit(date: DateValue): number {
		const result = date.compare(today(getLocalTimeZone()));

		if (result < 0) {
			return 24 / scheduleStepInHour;
		} else if (result > 0) {
			return 7 / scheduleStepInHour;
		} else {
			const now = new Date();
			return Math.max(
				7 / scheduleStepInHour,
				now.getHours() * 4 + Math.ceil((now.getMinutes() + 1) / 15)
			);
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
					handleToastFetch(
						fetch(endpoints.schedule.deleteByPatient(schedule.id), {
							method: 'DELETE',
							headers: {
								'content-type': 'application/json',
								Authorization: `Bearer ${$userStore.token}`
							}
						}),
						{ success: 'Xoá lịch hẹn thành công' },
						() => filtering()
					),
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

	async function searchDoctorFn(keyword: string): Promise<Selected<User>[] | undefined> {
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

		const data: ApiResponse<User[]> = await response.json();

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
			const [allScheduleData, scheduleOfPatientData, applicationsResponse] = await Promise.all([
				fetch(`${endpoints.schedule.getByPatient}?${searchParams}`, {
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				}).then<Pagination<ScheduleByPatient[]> | undefined>((x) => (x.ok ? x.json() : undefined)),
				fetch(`${endpoints.schedule.getOwnByPatient}?${searchParams}`, {
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				}).then<Pagination<ScheduleFull[]> | undefined>((x) => (x.ok ? x.json() : undefined)),
				fetch(`${endpoints.application.getByEmployee}?${searchParams}&isConfirm=true`, {
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				}).then<Pagination<Application[]> | undefined>((x) => (x.ok ? x.json() : undefined))
			]);

			let pendingSchedules: number[] = [];
			if (scheduleOfPatientData) {
				scheduleOfPatientData.data.forEach((x, i) => {
					x.order = i;
					x.startAt = new Date(x.startAt);
					x.endAt = x.endAt ? new Date(x.endAt) : undefined;
				});
				pendingSchedules = scheduleOfPatientData.data
					.filter((x) => x.status === ScheduleStatus.PENDING)
					.map((x) => x.id);

				patientSchedules = scheduleOfPatientData.data;
			}

			if (allScheduleData) {
				allScheduleData.data.forEach((x) => {
					x.startAt = new Date(x.startAt);
					x.endAt = new Date(x.endAt);
				});

				allSchedule = allScheduleData.data;
			}

			if (applicationsResponse) {
				applicationsResponse.data.forEach((x) => {
					x.startAt = new Date(x.startAt);
					x.endAt = new Date(x.endAt);
				});

				applications = applicationsResponse.data;
			}

			currentMonthValue = currentMonthValueTmp;
		} catch (error) {
			toast.error('Xuất hiện lỗi khi tải dữ liệu lịch hẹn');
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

	function scrollToSchedule(schedule: ScheduleFull) {
		const el = document.getElementById(`schedule-${schedule.id}`);
		if (el) {
			el.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
				inline: 'center'
			});
		}
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
					<ScheduleCard
						{schedule}
						{currentMinute}
						on:edit={(e) => editAppointment(e.detail)}
						on:scroll={(e) => scrollToSchedule(e.detail)}
						on:delete={(e) => deleteSchedule(e.detail)}
						on:reload={() => filtering()}
					/>
				{/each}
			</div>
		</div>
	{/if}
	<div>
		<div class="flex items-center gap-2 text-base sm:text-xl md:text-2xl font-light">
			<span class="text-surface-500">Lịch hẹn theo ngày / Tạo lịch</span>
			<hr class="flex-1 !border-surface-400" />
			<button type="button" class="btn btn-sm variant-filled-tertiary" on:click={() => filtering()}>
				<i class="fa-solid fa-rotate-left"></i>
				<span class="ml-1 font-semibold">Tải lại</span>
			</button>
		</div>
		<div>
			<Calendar.Root
				locale="vi"
				class="rounded-container-token sm:p-3 w-full"
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
												class="relative flex-1 h-8 max-w-10 sm:max-w-full sm:h-10 !p-0 text-center my-0.5"
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
		<div class="bg-white border shadow-md rounded-container-token p-4 pb-6 flex-1 h-fit relative">
			<div class="absolute left-4 right-4 bottom-2 h-2 flex gap-x-1">
				<span class="text-xs font-semibold pointer-events-none leading-[8px] w-9"
					>{Math.round((stepWidth * 100) / baseStepWidth)}%</span
				>
				<div class="h-2 bg-primary-50 rounded-full flex-1">
					<Slider.Root
						min={0}
						max={baseStepWidth * 3}
						step={1}
						let:thumbs
						onValueChange={(values) => {
							const width = scheduleListElement.getBoundingClientRect().width;
							const center = (width - doctorColumnWidth) / 2;
							const centerHour =
								(center + scheduleListElement.scrollLeft) / (stepWidth / scheduleStepInHour);
							stepWidth = baseStepWidth + values[0];
							scheduleListElement.scrollLeft =
								centerHour * (stepWidth / scheduleStepInHour) - center;
						}}
						class="bg-primary-50 mx-3 block relative h-2 rounded-full"
					>
						{#each thumbs as thumb}
							<Slider.Thumb {thumb} class="h-2 w-6 rounded-full bg-primary-500" />
						{/each}
					</Slider.Root>
				</div>
			</div>
			<div
				bind:this={scheduleListElement}
				class="min-h-56 {scheduleMenuOpened
					? 'overflow-hidden pr-scroll-bar pb-scroll-bar'
					: 'overflow-x-scroll'} {scheduleGrabing ? 'select-none' : ''}"
			>
				<div class="h-fit w-fit pl-32 sm:pl-40">
					<div
						class="sticky left-32 sm:left-40 -translate-x-32 sm:-translate-x-40 w-32 sm:w-40 h-0 z-20"
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
									class="absolute left-0 top-0 -right-10 border-b flex items-center justify-center h-full text-sm"
									on:submit|preventDefault|stopPropagation={addDoctorSubmit}
								>
									{#key scheduleByDoctors}
										<SearchCombobox
											placeholder="Tên bác sĩ..."
											searchFn={searchDoctorFn}
											regionInput="border-none bg-white w-full py-2 text-sm sm:text-base"
											bind:selected={addingDoctor}
											let:itemData
										>
											<div>
												<p>{itemData.label}</p>
												<p class="text-xs font-medium text-surface-400">{itemData.value.email}</p>
											</div>
										</SearchCombobox>
									{/key}
									<button
										disabled={!addingDoctor}
										type="submit"
										class="btn variant-filled-primary h-full w-10 flex-shrink-0 rounded-none"
									>
										<i class="fa-solid fa-plus"></i>
									</button>
								</form>
							</div>
						</div>
					</div>
					<div
						class="bg-slate-50 sticky border-b-2 -translate-y-10 top-10 h-10 w-fit flex z-10"
						style="margin-left: -{stepWidth * 2 - 40}px;"
					>
						{#each Array(25) as _, i}
							<div
								class="shrink-0 text-center leading-10 text-sm select-none font-semibold"
								style="width: {hourWidth}px;"
							>
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
								Math.max(Math.floor((e.clientX - bounding.left - 40) / stepWidth), 0),
								96
							);
							rowCount = Math.max(
								Math.min(Math.floor((e.clientY - bounding.top) / 64), scheduleByDoctors.length - 1),
								0
							);
						}}
					>
						<div class="absolute left-0 top-0 bottom-0 w-full flex *:h-full">
							<div class="w-10 bg-surface-50 untouchable pointer-events-none"></div>
							{#each Array(24) as _, i}
								<div
									class="shrink-0 border-r {i >= 23 ? 'untouchable' : ''}"
									style="width: {hourWidth}px;"
								></div>
							{/each}
							<div
								class="border-r bg-surface-50 untouchable pointer-events-none"
								style="width: {stepWidth * 2}px;"
							></div>
						</div>
						<div
							class="h-16 absolute z-10 {(scheduleHovering && canCreateSchedule) ||
							scheduleMenuOpened
								? 'opacity-100'
								: 'opacity-0 pointer-events-none'}"
							style="left: {hoverHintLeft}px; top: {hoverHintTop}px; width: {stepWidth}px"
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
						<div class="pl-10 w-full relative">
							<div
								on:dblclick={scrollToLimitEnd}
								class="w-10 untouchable absolute top-0 left-10 bottom-0 z-[1]"
								style="width: {blockPastWidth}px;"
							>
								<div class="w-0 ml-auto" bind:this={limitEndElement}></div>
							</div>
							{#each scheduleByDoctors as pair (pair[0].id)}
								{@const doctorApplications = blockRangeByApplications[pair[0].id]}
								<div class="h-16 w-full border-b border-dashed relative">
									{#each pair[1] as schedule (schedule.id)}
										{@const leftOffset =
											(schedule.startAt.getHours() / scheduleStepInHour +
												schedule.startAt.getMinutes() / scheduleStepInMinute) *
											stepWidth}
										{@const width = Math.max(
											(schedule.endAt.getHours() / scheduleStepInHour +
												schedule.endAt.getMinutes() / scheduleStepInMinute) *
												stepWidth -
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
										{:else}
											<TimelineItem schedule={ownSchedule} {stepWidth} />
										{/if}
									{/each}
									{#if doctorApplications}
										{#each doctorApplications as application}
											{@const leftOffset = application[0] * stepWidth}
											{@const width = Math.max(application[1] * stepWidth - leftOffset, 0)}
											<div
												class="h-full bg-red-400 absolute top-0 overflow-hidden untouchable"
												style="left: {leftOffset}px; width: {width}px"
											></div>
										{/each}
									{/if}
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
