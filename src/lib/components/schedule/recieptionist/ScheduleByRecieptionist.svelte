<script lang="ts">
	import { Calendar, DropdownMenu, Slider, type Selected } from 'bits-ui';
	import { today, getLocalTimeZone, type DateValue } from '@internationalized/date';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import CreateAppoimentByRecieptionist from '$lib/components/schedule/recieptionist/CreateAppoimentByRecieptionist.svelte';
	import SearchCombobox from '$lib/components/common/SearchCombobox.svelte';
	import endpoints from '$lib/endpoints';
	import { getContext, onDestroy, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { formatCompactDate, formatCompactDateTime } from '$lib/helpers/formatters';
	import TimelineItem from '$lib/components/schedule/TimelineItem.svelte';
	import { scheduleFilterSchema } from '$lib/form-schemas/schedule-filter-schema';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import ListFilterForm from '$lib/components/schedule/ListFilterForm.svelte';
	import { z } from 'zod';
	import type { createAppointmentSchema } from '$lib/form-schemas/create-appointment-schema';
	import {
		ScheduleStatus,
		scheduleStatusInfo,
		scheduleStepInHour,
		scheduleStepInMinute
	} from '$lib/constants/schedule-constant';
	import ConfirmScheduleForm from './ConfirmScheduleForm.svelte';
	import type { editScheduleSchema } from '$lib/form-schemas/edit-schedule-schema';
	import { toast } from 'svelte-sonner';
	import { MinuteTick } from '$lib/helpers/minute-tick';
	import EditAppointmentReceptionist from './EditAppointmentReceptionist.svelte';
	import ScheduleListInDay from './ScheduleListInDay.svelte';
	import {
		getDayValue,
		handleToastFetch,
		normalizeStartEnd,
		normalizeTime
	} from '$lib/helpers/utils';

	export let scheduleFilterForm: SuperValidated<z.infer<typeof scheduleFilterSchema>>;
	export let initialSchedule: ScheduleFull[];
	export let createAppointmentForm: SuperValidated<z.infer<typeof createAppointmentSchema>>;
	export let editScheduleForm: SuperValidated<z.infer<typeof editScheduleSchema>>;
	export let applications: Application[];

	const scheduleStatusArray = <(keyof typeof scheduleStatusInfo)[]>(
		(<unknown[]>Object.keys(scheduleStatusInfo))
	);
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const modalStore = getModalStore();
	const form = superForm(scheduleFilterForm, {
		SPA: true,
		resetForm: false,
		validators: zodClient(scheduleFilterSchema),
		onUpdate: ({ form }) => {
			filtering({ ...form.data });
		}
	});
	const upperLimit = 23 / scheduleStepInHour;
	const baseStepWidth = 32;
	const doctorColumnWidth = 160;
	const scheduleActions: ScheduleMenuItem[] = [
		{
			label: 'Xác nhận lịch tạo bởi bệnh nhân',
			shortLabel: 'Xác nhận',
			icon: 'fa-regular fa-handshake',
			availableWhen: (schedule) => schedule.status === ScheduleStatus.PENDING,
			click: (schedule) => openScheduleConfirmModal(schedule)
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
			click: (schedule) => patientCheckin(schedule)
		},
		{
			label: 'Huỷ lịch do bệnh nhân không tới',
			shortLabel: 'Huỷ',
			icon: 'fa-regular fa-calendar-circle-minus',
			availableWhen: (schedule, time) =>
				schedule.status === ScheduleStatus.PENDING ||
				(schedule.status == ScheduleStatus.CONFIRMED && time > schedule.startAt),
			click: (schedule) => cancelSchedule(schedule)
		},
		{
			label: 'Sửa lịch hẹn',
			shortLabel: 'Sửa',
			icon: 'fa-regular fa-calendar-lines-pen',
			availableWhen: (schedule, time) =>
				schedule.status !== ScheduleStatus.CANCEL && !!schedule.endAt && schedule.endAt > time,
			click: (schedule) => editSchedule(schedule)
		},
		{
			label: 'Xoá lịch hẹn',
			shortLabel: 'Xoá',
			icon: 'fa-regular fa-trash-can',
			availableWhen: (schedule, time) =>
				(schedule.status === ScheduleStatus.PENDING ||
					schedule.status == ScheduleStatus.CONFIRMED) &&
				(!schedule.endAt || time < schedule.endAt),
			click: (schedule) => deleteSchedule(schedule)
		}
	];
	let schedules = [...initialSchedule];
	let currentMinute = new Date();
	let scheduleGrabing = false;
	let mouseAnchor: { x: number; y: number };
	let scheduleScroll: { x: number; y: number };
	let scheduleListElement: HTMLDivElement;
	let scheduleHovering = false;
	let quarterCount = 0;
	let rowCount = 0;
	let hoverHintTop = 0;
	let preventNextContextMenu = false;
	let timelineSelection = false;
	let selectedStart = 0;
	let selectedEnd = 0;
	let selectedTop = 0;
	let scheduleMenuOpened = false;
	let scheduleMenuTriggerLeft = 0;
	let scheduleMenuTriggerTop = 0;
	let preventCancelSelection = false;
	let selectedDate: DateValue = today(getLocalTimeZone());
	let currentMonthValue = selectedDate.year * 100 + selectedDate.month;
	let addingDoctor: Selected<User> | undefined;
	let selectionInDoctor: UserMinimal | undefined;
	let canCreateSchedule = true;
	let rangeLimit: [number, number] = [0, 0];
	let lastFilterOptions: Partial<z.infer<typeof scheduleFilterSchema>> = {};
	let limitEndElement: HTMLDivElement;
	let editingSchedule: ScheduleFull | undefined;
	let timeChanged = false;
	let stepWidth = baseStepWidth;
	let endSliderValue = 0;
	let endHovering = false;
	let warningTimeout: NodeJS.Timeout | undefined;
	let allowWarning = true;

	$: onEndSliderValueChanged(endSliderValue);
	$: hourWidth = stepWidth * 4;
	$: lowerLimit = calculateLowerLimit(selectedDate, currentMinute);
	$: blockPastWidth = lowerLimit * stepWidth;
	$: selectedDateSchedules = schedules.filter((x) => x.startAt.getDate() === selectedDate.day);
	$: scheduleByDoctors = extractScheduleByDoctor(selectedDateSchedules);
	$: ({ 1: blockRangeByDoctors, 2: blockRangeByApplications } = calculateBlockRange(
		scheduleByDoctors,
		editingSchedule,
		applications,
		selectedDate
	));
	$: canCreateSchedule =
		quarterCount >= lowerLimit &&
		quarterCount <= upperLimit &&
		!blockRangeByDoctors[rowCount]?.some((x) => quarterCount >= x[0] && quarterCount < x[1]);
	$: hoverHintTop = rowCount * 64;
	$: hoverHintLeft = quarterCount * stepWidth + 40;
	$: hoveringHours = Math.floor(quarterCount / 4);
	$: hoveringMinutes = (quarterCount % 4) * 15;
	$: selectedLeft = Math.min(selectedStart, selectedEnd) * stepWidth + 40;
	$: selectedRange = Math.abs(selectedEnd - selectedStart);
	$: selectedWidth = selectedRange * stepWidth;
	$: selectedStartHours = Math.floor(Math.min(selectedStart, selectedEnd) / 4);
	$: selectedStartMinutes = (Math.min(selectedStart, selectedEnd) % 4) * 15;
	$: selectedEndHours = Math.floor(Math.max(selectedStart, selectedEnd) / 4);
	$: selectedEndMinutes = (Math.max(selectedStart, selectedEnd) % 4) * 15;
	$: sliderLower = Math.max(lowerLimit, Math.min(selectedStart, selectedEnd));

	onMount(() => {
		MinuteTick.addEvent(calculateLowerLimitActive);
	});

	onDestroy(() => {
		MinuteTick.removeEvent(calculateLowerLimitActive);
	});

	function onEndSliderValueChanged(value: number) {
		if (!editingSchedule) {
			return;
		}

		if (selectedEnd > selectedStart) {
			selectedEnd = sliderLower + value + 1;
		} else {
			selectedStart = sliderLower + value + 1;
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

	function calculateLowerLimitActive(time: Date) {
		currentMinute = time;
		lowerLimit = calculateLowerLimit(selectedDate, currentMinute);
	}

	function calculateLowerLimit(date: DateValue, currentMinute: Date): number {
		const result = date.compare(today(getLocalTimeZone()));

		if (result < 0) {
			return 24 / scheduleStepInHour;
		} else if (result > 0) {
			return 7 / scheduleStepInHour;
		} else {
			return Math.max(
				7 / scheduleStepInHour,
				currentMinute.getHours() * 4 + Math.ceil((currentMinute.getMinutes() + 1) / 15)
			);
		}
	}

	async function filtering(
		filterOptions: Partial<z.infer<typeof scheduleFilterSchema>>,
		month: number | undefined = undefined
	) {
		if (!$userStore) {
			return;
		}

		const filterOptionsExtended: Record<string, string | boolean | undefined> = {
			...filterOptions,
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

		const url = `${endpoints.schedule.getByRecieptionist}?${searchParams}`;

		try {
			const [schedulesResponse, applicationsResponse] = await Promise.all([
				fetch(url, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				}).then<Pagination<ScheduleFull[]>>((r) => r.json()),
				fetch(`${endpoints.application.getByEmployee}?${searchParams}&isConfirm=true`, {
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				}).then<Pagination<Application[]>>((r) => r.json())
			]);

			schedulesResponse.data.forEach((x, i) => {
				x.startAt = new Date(x.startAt);
				x.endAt = x.endAt ? new Date(x.endAt) : undefined;
				x.order = i;
			});
			applicationsResponse.data.forEach((x) => {
				x.startAt = new Date(x.startAt);
				x.endAt = new Date(x.endAt);
			});

			schedules = schedulesResponse.data;
			applications = applicationsResponse.data;
			lastFilterOptions = filterOptions;
			currentMonthValue = currentMonthValueTmp;
		} catch (error) {
			toast.error('Xuất hiện lỗi khi tải dữ liệu lịch hẹn');
			console.log(error);
		}
	}

	function calculateBlockRange(
		scheduleByDoctors: [UserMinimal, ScheduleFull[]][],
		editingSchedule: ScheduleFull | undefined | null,
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
						const values = normalizeStartEnd(y.startAt, y.endAt);
						values[0] = Math.floor(values[0]);
						values[1] = Math.ceil(values[1]);
						doctorApplications.push(values);
					} else if (startDayValue === currentDayValue) {
						doctorApplications.push([
							Math.floor(normalizeTime(y.startAt)),
							24 / scheduleStepInHour
						]);
					} else if (endDayValue === currentDayValue) {
						doctorApplications.push([0, Math.ceil(normalizeTime(y.startAt))]);
					}
				});

			return {
				1: x[0].id,
				2: x[1]
					.filter((y) => y.status !== ScheduleStatus.PENDING && y.id !== editingSchedule?.id)
					.map((y) => normalizeStartEnd(y.startAt, y.endAt))
					.concat(doctorApplications),
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

	function extractScheduleByDoctor(
		scheduleInDay: ScheduleFull[] = selectedDateSchedules
	): [UserMinimal, ScheduleFull[]][] {
		const doctors: Record<number, [UserMinimal, ScheduleFull[]]> = {};

		scheduleInDay
			.filter((x) => x.status !== ScheduleStatus.CANCEL)
			.forEach((s) => {
				const doctorId = s.doctor.id;
				if (!doctors[doctorId]) {
					doctors[doctorId] = [s.doctor, []];
				}

				doctors[doctorId][1].push(s);
			});

		return Object.values(doctors);
	}

	function createAppointment() {
		if (!selectionInDoctor) {
			return;
		}

		preventCancelSelection = true;
		const setting: ModalSettings = {
			type: 'component',
			component: {
				ref: CreateAppoimentByRecieptionist,
				props: {
					createAppointmentForm,
					startHour: selectedStartHours,
					startMinute: selectedStartMinutes,
					endHour: selectedEndHours,
					endMinute: selectedEndMinutes,
					date: selectedDate.toDate(getLocalTimeZone()),
					doctor: selectionInDoctor
				}
			},
			response: (r) => {
				if (r) {
					updateScheduleList();
					return;
				}
				scheduleMenuOpened = true;
			}
		};
		modalStore.trigger(setting);
	}

	function updateScheduleList() {
		cancelSelection();
		filtering(lastFilterOptions, selectedDate.month);
	}

	function calculateRangeLimit(): [number, number] {
		const posibleStartLimits = [lowerLimit, ...blockRangeByDoctors[rowCount].map((x) => x[1])];
		const posibleEndLimits = [upperLimit, ...blockRangeByDoctors[rowCount].map((x) => x[0])];
		posibleStartLimits.sort((a, b) => b - a);
		posibleEndLimits.sort((a, b) => a - b);
		return [
			posibleStartLimits.find((x) => x < selectedStart) ?? lowerLimit,
			posibleEndLimits.find((x) => x > selectedStart) ?? upperLimit
		];
	}

	function scheduleDragStart(e: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		if (scheduleByDoctors.length === 0 || endHovering) {
			return;
		}
		if (
			editingSchedule &&
			editingSchedule.status === ScheduleStatus.DONE &&
			editingSchedule.startAt <= new Date()
		) {
			if (warningTimeout) {
				clearTimeout(warningTimeout);
				warningTimeout = undefined;
			}

			warningTimeout = setTimeout(() => {
				allowWarning = true;
			}, 5000);

			if (allowWarning) {
				allowWarning = false;
				toast.warning('Khi lịch hẹn đã bắt đầu, chỉ có thể thay đổi thời gian kết thúc', {
					duration: 5000
				});
			}
			return;
		}
		if (e.button === 0 && !scheduleGrabing && canCreateSchedule) {
			timelineSelection = true;
			selectedStart = selectedEnd = quarterCount;
			timeChanged = true;
			rangeLimit = calculateRangeLimit();

			scheduleMenuTriggerTop = selectedTop = rowCount * 64;
			selectionInDoctor = scheduleByDoctors[rowCount][0];
			return;
		}
		if (e.button !== 2) {
			return;
		}
		if (timelineSelection) {
			timelineSelection = false;
		}
		if (selectedRange > 0) {
			return;
		}
		mouseAnchor = { x: e.x, y: e.y };
		scheduleScroll = {
			x: scheduleListElement.scrollLeft,
			y: scheduleListElement.scrollTop
		};
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
		if (scheduleGrabing) {
			preventNextContextMenu = true;
		}
		if (timelineSelection && selectedRange > 0 && !editingSchedule) {
			scheduleMenuOpened = true;
		}
		scheduleGrabing = false;
		timelineSelection = false;
	}

	function cancelSelection() {
		if (preventCancelSelection) {
			preventCancelSelection = false;
			return;
		}
		selectedEnd = selectedStart = 0;
		selectionInDoctor = undefined;
		editingSchedule = undefined;
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
		if (editingSchedule) {
			selectedEnd = selectedStart = 0;
		}
		if (!date || (Array.isArray(date) && date.length === 0)) {
			return;
		}

		const selectedDateTmp = Array.isArray(date) ? date[0] : date;

		if (selectedDateTmp.year * 100 + selectedDateTmp.month !== currentMonthValue) {
			await filtering(lastFilterOptions, selectedDateTmp.month);
		}

		selectedDate = selectedDateTmp;
	}

	function openScheduleConfirmModal(schedule: ScheduleFull) {
		if (schedule.status !== ScheduleStatus.PENDING) {
			return;
		}

		const startStep = normalizeTime(schedule.startAt);
		const endLimitStep =
			schedules
				.filter(
					(x) =>
						x.doctor.id === schedule.doctor.id && x.startAt.getDate() === schedule.startAt.getDate()
				)
				.map((x) => normalizeTime(x.startAt))
				.concat((blockRangeByApplications[schedule.doctor.id] ?? []).map((x) => x[0]))
				.sort((a, b) => a - b)
				.find((x) => x > startStep) ?? 23 / scheduleStepInHour;

		const modelSettings: ModalSettings = {
			type: 'component',
			component: {
				ref: ConfirmScheduleForm,
				props: {
					editScheduleForm,
					schedule,
					maxStep: endLimitStep - startStep
				}
			},
			response: (r) => {
				if (!r) {
					return;
				}
				filtering(lastFilterOptions);
			}
		};
		modalStore.trigger(modelSettings);
	}

	function patientCheckin(schedule: ScheduleFull) {
		const modalSetting: ModalSettings = {
			type: 'confirm',
			title: 'Xác nhận',
			body: `Xác nhận bệnh nhân ${schedule.patient.name} đã tới`,
			response: (r) => {
				if (!r || !$userStore) {
					return;
				}

				toast.promise(
					handleToastFetch(
						fetch(endpoints.schedule.checkin(schedule.id), {
							method: 'PUT',
							headers: {
								'content-type': 'application/json',
								Authorization: `Bearer ${$userStore.token}`
							}
						}),
						{
							success: `Trạng thái của lịch hẹn đã chuyển thành '${scheduleStatusInfo[ScheduleStatus.DONE].label}'`
						},
						() => filtering(lastFilterOptions)
					),
					{
						loading: 'Đang xử lý...',
						success: (msg) =>
							msg ??
							`Trạng thái của lịch hẹn đã chuyển thành '${scheduleStatusInfo[ScheduleStatus.DONE].label}'`,
						error: (msg) =>
							String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình cập nhật trạng thái lịch hẹn'
					}
				);
			}
		};
		modalStore.trigger(modalSetting);
	}

	function editSchedule(schedule: ScheduleFull) {
		if (!schedule.endAt) {
			return;
		}
		scrollToSchedule(schedule);
		editingSchedule = schedule;
		selectedStart =
			schedule.startAt.getHours() / scheduleStepInHour +
			schedule.startAt.getMinutes() / scheduleStepInMinute;
		selectedEnd =
			schedule.endAt.getHours() / scheduleStepInHour +
			schedule.endAt.getMinutes() / scheduleStepInMinute;
		rowCount = scheduleByDoctors.findIndex((x) => x[0].id === schedule.doctor.id);
		selectedTop = rowCount * 64;
		sliderLower = Math.max(lowerLimit, Math.min(selectedStart, selectedEnd));
		endSliderValue = Math.abs(Math.max(selectedEnd, selectedStart) - sliderLower) - 1;
		timeChanged = false;
		rangeLimit = calculateRangeLimit();
		selectionInDoctor = schedule.doctor;
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

	function deleteSchedule(schedule: ScheduleFull) {
		const modalSetting: ModalSettings = {
			type: 'confirm',
			title: 'Xác nhận xoá lịch',
			body: `Bạn có chắc muốn xoá lịch của bệnh nhân ${schedule.patient.name} vào lúc ${formatCompactDateTime(schedule.startAt)}`,
			response: (r) => {
				if (!r || !$userStore) {
					return;
				}

				toast.promise(
					handleToastFetch(
						fetch(endpoints.schedule.deleteByRecieptionist(schedule.id), {
							method: 'DELETE',
							headers: {
								'content-type': 'application/json',
								Authorization: `Bearer ${$userStore.token}`
							}
						}),
						{ success: 'Xoá lịch hẹn thành công' },
						() => filtering(lastFilterOptions)
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

	function cancelSchedule(schedule: ScheduleFull) {
		const modalSetting: ModalSettings = {
			type: 'confirm',
			title: 'Xác nhận huỷ lịch',
			body: `Bạn có chắc muốn huỷ lịch của bệnh nhân ${schedule.patient.name} do bệnh nhân không tới`,
			response: (r) => {
				if (!r || !$userStore) {
					return;
				}

				toast.promise(
					handleToastFetch(
						fetch(endpoints.schedule.cancel(schedule.id), {
							method: 'PUT',
							headers: {
								'content-type': 'application/json',
								Authorization: `Bearer ${$userStore.token}`
							}
						}),
						{ success: 'Huỷ lịch hẹn thành công' },
						() => filtering(lastFilterOptions)
					),
					{
						loading: 'Đang xử lý...',
						success: (msg) => msg ?? 'Huỷ lịch hẹn thành công',
						error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình huỷ lịch hẹn'
					}
				);
			}
		};
		modalStore.trigger(modalSetting);
	}
</script>

<svelte:head>
	<title>Danh sách lịch hẹn</title>
</svelte:head>
<svelte:window
	on:mousemove={scheduleDragging}
	on:mouseup={scheduleDragEnd}
	on:contextmenu={(e) => {
		if (preventNextContextMenu) {
			preventNextContextMenu = false;
			e.preventDefault();
			e.stopPropagation();
		}
	}}
/>
<div class="pt-header bg-stone-50 h-screen">
	<div class="flex flex-col gap-4 p-4 h-full">
		{#if editingSchedule}
			<div
				transition:fade={{ duration: 200 }}
				class="fixed left-0 top-0 right-0 bottom-0 bg-black/60 z-[100]"
			></div>
		{/if}
		<ListFilterForm
			{form}
			on:reset={() => {
				filtering(lastFilterOptions);
			}}
		/>
		<div class="flex gap-4">
			<ScheduleListInDay {scrollToSchedule} {selectedDateSchedules} actions={scheduleActions}>
				{#if editingSchedule}
					{@const startAt = new Date(
						selectedDate.year,
						selectedDate.month - 1,
						selectedDate.day,
						selectedStartHours,
						selectedStartMinutes
					)}
					{@const endAt = new Date(
						selectedDate.year,
						selectedDate.month - 1,
						selectedDate.day,
						selectedEndHours,
						selectedEndMinutes
					)}
					<div
						transition:fly={{
							duration: 200,
							y: 200
						}}
						class="absolute left-0 right-0 bottom-0 z-[200]"
					>
						<EditAppointmentReceptionist
							{editScheduleForm}
							schedule={editingSchedule}
							{startAt}
							{endAt}
							doctor={selectionInDoctor}
							on:cancel={cancelSelection}
							on:updated={updateScheduleList}
						/>
					</div>
				{/if}
			</ScheduleListInDay>
			<div class={editingSchedule ? 'z-[200]' : ''}>
				{#key editingSchedule}
					<Calendar.Root
						locale="vi"
						class="rounded-container-token border bg-white p-4 shadow-md"
						let:months
						let:weekdays
						preventDeselect={true}
						value={selectedDate}
						onValueChange={onSelectedDateChange}
						minValue={editingSchedule ? today(getLocalTimeZone()) : undefined}
					>
						<Calendar.Header class="flex items-center h-10">
							<Calendar.Heading class="text-lg font-semibold capitalize tracking-tight ml-2.5" />
							<Calendar.PrevButton
								class="size-8 p-2 text-secondary-500 hover:variant-soft-secondary disabled:text-black btn ml-auto"
							>
								<i class="fa-solid fa-chevron-left"></i>
							</Calendar.PrevButton>
							<Calendar.NextButton
								class="size-8 p-2 text-secondary-500 hover:variant-soft-secondary disabled:text-black btn"
							>
								<i class="fa-solid fa-chevron-right"></i>
							</Calendar.NextButton>
						</Calendar.Header>

						<div class="flex flex-col space-y-4 pt-3 sm:flex-row sm:space-x-4 sm:space-y-0">
							{#each months as month}
								<Calendar.Grid class="w-full border-collapse select-none space-y-1">
									<Calendar.GridHead>
										<Calendar.GridRow class="mb-1 flex w-full justify-between">
											{#each weekdays as day}
												<Calendar.HeadCell
													class="w-10 rounded-md text-xs text-surface-400 font-medium"
												>
													<div>{day.slice(0, 2)}</div>
												</Calendar.HeadCell>
											{/each}
										</Calendar.GridRow>
									</Calendar.GridHead>
									<Calendar.GridBody>
										{#each month.weeks as weekDates}
											<Calendar.GridRow class="flex w-full gap-2">
												{#each weekDates as date}
													<Calendar.Cell {date} class="relative w-10 h-10 !p-0 text-center">
														<Calendar.Day
															{date}
															month={month.value}
															class="group relative font-medium inline-flex w-full h-full items-center justify-center whitespace-nowrap rounded-full border border-transparent bg-transparent p-0 text-foreground transition-all hover:border-primary-700 data-[disabled]:pointer-events-none data-[outside-month]:pointer-events-none data-[selected]:bg-primary-200 data-[selected]:font-semibold data-[selected]:text-primary-700 data-[disabled]:text-surface-300 data-[unavailable]:text-surface-300 data-[unavailable]:line-through"
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
				{/key}
			</div>
		</div>
		<div class="flex flex-1 gap-4">
			<div
				class="bg-white border shadow-md rounded-container-token p-4 pb-6 flex-1 h-auto relative {editingSchedule
					? 'z-[200]'
					: ''}"
			>
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
					class="absolute top-4 left-4 bottom-6 right-4 {scheduleMenuOpened
						? 'overflow-hidden pr-scroll-bar pb-scroll-bar'
						: 'overflow-scroll'} {scheduleGrabing || timelineSelection ? 'select-none' : ''}"
				>
					<div class="h-fit w-fit pl-40">
						<div class="sticky left-40 -translate-x-40 w-40 h-0 z-20">
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
										class="absolute left-0 top-0 border-b flex items-center justify-center h-full -right-10"
										on:submit|preventDefault|stopPropagation={addDoctorSubmit}
									>
										{#key scheduleByDoctors}
											<SearchCombobox
												placeholder="Tên bác sĩ..."
												searchFn={searchDoctorFn}
												regionInput="border-none bg-white w-full py-2"
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
											class="btn variant-filled-primary h-full flex-shrink-0 rounded-none transition-none w-10"
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
								if (endHovering) {
									return;
								}
								const bounding = e.currentTarget.getBoundingClientRect();
								quarterCount = Math.min(
									Math.max(Math.round((e.clientX - bounding.left - 40) / stepWidth), 0),
									24 / scheduleStepInHour
								);
								rowCount = Math.max(
									Math.min(
										Math.floor((e.clientY - bounding.top) / 64),
										scheduleByDoctors.length - 1
									),
									0
								);
								if (timelineSelection) {
									selectedEnd = Math.min(Math.max(quarterCount, rangeLimit[0]), rangeLimit[1]);
									endSliderValue = Math.abs(Math.max(selectedEnd, selectedStart) - sliderLower) - 1;
									scheduleMenuTriggerLeft = (selectedEnd + 2) * stepWidth;
								}
							}}
						>
							<div class="absolute left-0 top-0 bottom-0 w-full flex *:h-full">
								<div class="border-r bg-surface-50 untouchable pointer-events-none w-10"></div>
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
								class="h-12 my-2 w-1 bg-red-300 rounded-full absolute z-10 top-0 -translate-x-1/2 {scheduleHovering &&
								!scheduleMenuOpened &&
								(selectedRange === 0 || !timelineSelection) &&
								canCreateSchedule &&
								!endHovering
									? 'opacity-100'
									: 'opacity-0'}"
								style="left: {hoverHintLeft}px; top: {hoverHintTop}px;"
							>
								<div
									class="absolute z-20 text-center -top-11 left-1/2 shadow-md text-tertiary-600 text-sm font-semibold -translate-x-1/2 px-2 py-1 border rounded-md bg-white select-none"
								>
									{hoveringHours}:{String(hoveringMinutes).padStart(2, '0')}
								</div>
							</div>
							<div
								class="h-16 py-0.5 absolute z-[2] {selectedRange > 0 ? 'block' : 'hidden'}"
								style="left: {selectedLeft}px; top: {selectedTop}px; width: {selectedWidth}px"
							>
								<div
									class="bg-orange-100 border border-orange-200 rounded-md h-full flex overflow-hidden"
								>
									<div class="bg-orange-400 w-1"></div>
									<div
										class="absolute text-center z-20 -top-9 left-1/2 shadow-md text-tertiary-600 text-sm font-semibold -translate-x-1/2 px-2 py-1 border rounded-md bg-white select-none w-32"
									>
										{selectedStartHours}:{String(Math.round(selectedStartMinutes)).padStart(2, '0')}
										-
										{selectedEndHours}:{String(Math.round(selectedEndMinutes)).padStart(2, '0')}
									</div>
									<div class="bg-orange-400 w-1 ml-auto"></div>
								</div>
							</div>
							{#if editingSchedule}
								<div
									class="absolute z-50 h-16 flex items-center"
									style="left: {sliderLower * stepWidth +
										40 +
										stepWidth -
										8}px; top: {selectedTop}px; width: {(rangeLimit[1] - sliderLower - 1) *
										stepWidth +
										12}px"
								>
									<input
										type="range"
										class="end-slider"
										max={rangeLimit[1] - sliderLower - 1}
										bind:value={endSliderValue}
										on:mouseenter={() => (endHovering = true)}
										on:mouseleave={() => (endHovering = false)}
									/>
								</div>
							{/if}
							<DropdownMenu.Root
								preventScroll={false}
								bind:open={scheduleMenuOpened}
								onOpenChange={(o) => {
									if (!o) {
										cancelSelection();
									}
								}}
							>
								<DropdownMenu.Trigger
									class="absolute h-16 pointer-events-none opacity-0"
									style="left: {scheduleMenuTriggerLeft}px; top: {scheduleMenuTriggerTop}px;"
								/>
								<DropdownMenu.Content
									transition={fly}
									transitionConfig={{
										duration: 200,
										y: 30,
										easing: cubicOut
									}}
									class="w-fit rounded-md border border-surface-100 bg-white p-1 shadow-lg {editingSchedule
										? 'z-[200]'
										: 'z-20'}"
								>
									{#if !editingSchedule}
										<DropdownMenu.Item
											on:click={createAppointment}
											class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 data-[disabled]:pointer-events-none data-[disabled]:text-surface-300 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
										>
											<div class="size-4 text-center *:block">
												<i class="fa-regular fa-calendar-check"></i>
											</div>
											<span class="font-semibold text-sm leading-4">Tạo lịch hẹn</span>
										</DropdownMenu.Item>
									{/if}
									<DropdownMenu.Item
										on:click={cancelSelection}
										class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 data-[disabled]:pointer-events-none data-[disabled]:text-surface-300 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
									>
										<div class="size-4 text-center *:block">
											<i class="fa-regular fa-circle-xmark"></i>
										</div>
										<span class="font-semibold text-sm leading-4">Huỷ</span>
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
							<div class="w-full relative pl-10">
								<div
									on:dblclick={scrollToLimitEnd}
									class="w-10 untouchable absolute top-0 bottom-0 z-[1] select-none left-10"
									style="width: {blockPastWidth}px"
								>
									<div class="w-0 ml-auto" bind:this={limitEndElement}></div>
								</div>
								{#each scheduleByDoctors as pair (pair[0].id)}
									{@const doctorApplications = blockRangeByApplications[pair[0].id]}
									<div class="h-16 w-full border-b border-dashed relative">
										{#each pair[1] as schedule (schedule.id)}
											{#if schedule.id !== editingSchedule?.id}
												<TimelineItem {schedule} {stepWidth} />
											{:else if timeChanged}
												<TimelineItem {schedule} {stepWidth} placeholder />
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
			<div class="w-32 py-2 relative">
				<p class="absolute bottom-0 right-0 text-xs font-medium">
					{formatCompactDate(selectedDate.toDate(getLocalTimeZone()))}
				</p>
				<p class="text-sm font-bold">Trạng thái</p>
				<div class="space-y-2 font-medium mt-3">
					{#each scheduleStatusArray as o}
						<div class="flex items-center gap-2">
							<div
								class="size-5 rounded-full border {(scheduleStatusInfo[o]?.styleClasses ?? []).join(
									' '
								)}"
							></div>
							<p>{scheduleStatusInfo[o].label}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	.end-slider {
		@apply appearance-none h-10 relative bg-transparent pointer-events-none;
	}

	.end-slider::-webkit-slider-thumb {
		@apply appearance-none w-3 h-10 bg-primary-500 transition-opacity duration-100 opacity-0 rounded-full pointer-events-auto;
	}

	.end-slider::-webkit-slider-thumb:hover {
		@apply shadow shadow-black/40 opacity-100;
	}
</style>
