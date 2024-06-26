<script lang="ts">
	import type { PageData } from './$types';
	import { Calendar, DropdownMenu } from 'bits-ui';
	import { today, getLocalTimeZone } from '@internationalized/date';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import CreateAppoiment from '$lib/components/schedule/CreateAppoiment.svelte';

	export let data: PageData;

	const modalStore = getModalStore();
	let scheduleGrabing = false;
	let mouseAnchor: { x: number; y: number };
	let scheduleScroll: { x: number; y: number };
	let scheduleListElement: HTMLDivElement;
	let scheduleHovering = false;
	let quarterCount = 0;
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
	let currentDate = today(getLocalTimeZone());

	$: hoverHintLeft = (quarterCount + 2) * 32;
	$: hoveringHours = Math.floor(quarterCount / 4);
	$: hoveringMinutes = (quarterCount % 4) * 15;
	$: selectedLeft = (Math.min(selectedStart, selectedEnd) + 2) * 32;
	$: selectedRange = Math.abs(selectedEnd - selectedStart);
	$: selectedWidth = selectedRange * 32;
	$: selectedStartHours = Math.floor(Math.min(selectedStart, selectedEnd) / 4);
	$: selectedStartMinutes = (Math.min(selectedStart, selectedEnd) % 4) * 15;
	$: selectedEndHours = Math.floor(Math.max(selectedStart, selectedEnd) / 4);
	$: selectedEndMinutes = (Math.max(selectedStart, selectedEnd) % 4) * 15;

	function createAppointment() {
		preventCancelSelection = true;
		const setting: ModalSettings = {
			type: 'component',
			component: {
				ref: CreateAppoiment,
				props: {
					createAppointmentForm: data.createAppointmentForm,
					startHour: selectedStartHours,
					startMinute: selectedStartMinutes,
					endHour: selectedEndHours,
					endMinute: selectedEndMinutes,
					date: currentDate.toDate(getLocalTimeZone())
				}
			},
			response: (r) => {
				if (r) {
					cancelCreateSchedule();
					return;
				}
				scheduleMenuOpened = true;
			}
		};
		modalStore.trigger(setting);
	}

	function scheduleDragStart(e: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		if (e.button === 0 && !scheduleGrabing) {
			timelineSelection = true;
			const bounding = e.currentTarget.getBoundingClientRect();
			selectedStart = selectedEnd = Math.round(Math.max(e.clientX - bounding.left - 62, 0) / 32);
			scheduleMenuTriggerTop = selectedTop = Math.floor((e.clientY - bounding.top) / 64) * 64;
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
		if (timelineSelection && selectedRange > 0) {
			scheduleMenuOpened = true;
		}
		scheduleGrabing = false;
		timelineSelection = false;
	}

	function cancelCreateSchedule() {
		if (preventCancelSelection) {
			preventCancelSelection = false;
			return;
		}
		selectedEnd = selectedStart = 0;
	}
</script>

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
		<div class="col-span-2">thanh search nằm ở đây</div>
		<div class="flex gap-4">
			<div
				class="bg-white border shadow-md rounded-container-token p-4 flex-1 flex flex-col h-[19.25rem] *:grid-cols-[3rem_1fr_8rem_1fr_5rem]"
			>
				<div
					class="grid pb-2 border-b font-bold text-sm text-surface-500 tracking-wide pr-scrollBar"
				>
					<span class="text-center">#</span>
					<span class="text-center">Bệnh nhân</span>
					<span class="text-center">Thời gian</span>
					<span class="text-center">Bác sĩ</span>
					<span class="text-center">Đã tới</span>
				</div>
				<div class="grid overflow-y-scroll flex-1 items-center content-start">
					{#each Array(12) as _, i}
						<span class="py-2 text-center">{i + 1}</span>
						<span class="py-2 text-center">Bệnh nhân A</span>
						<span class="py-2 text-center">
							<span class="badge variant-soft-tertiary">13:00</span>
							-
							<span class="badge variant-soft-tertiary">15:00</span>
						</span>
						<span class="py-2 text-center">Bác sĩ B</span>
						<span class="py-2 text-center">
							<i class="fa-solid fa-circle-check text-success-500 text-xl"></i>
						</span>
					{/each}
				</div>
			</div>
			<div>
				<Calendar.Root
					locale="vi"
					class="rounded-container-token border bg-white p-4 shadow-md"
					let:months
					let:weekdays
					preventDeselect={true}
					bind:value={currentDate}
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
			</div>
		</div>
		<div
			class="col-span-2 bg-white border shadow-md rounded-container-token p-4 flex-1 h-64 relative"
		>
			<div
				bind:this={scheduleListElement}
				class="absolute top-4 left-4 bottom-4 right-4 {scheduleMenuOpened
					? 'overflow-hidden pr-scrollBar pb-scrollBar'
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
							{#each Array(10) as _}
								<div class="h-16 border-b flex items-center justify-center">Bác sĩ A</div>
							{/each}
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
						on:mouseenter={() => (scheduleHovering = true)}
						on:mouseleave={() => (scheduleHovering = false)}
						on:mousemove={(e) => {
							const bounding = e.currentTarget.getBoundingClientRect();
							quarterCount = Math.round(Math.max(e.clientX - bounding.left - 62, 0) / 32);
							hoverHintTop = Math.floor((e.clientY - bounding.top) / 64) * 64;
							if (timelineSelection) {
								scheduleMenuTriggerLeft = ((selectedEnd = quarterCount) + 2) * 32;
							}
						}}
					>
						<div class="absolute left-0 top-0 bottom-0 w-full flex *:h-full">
							<div class="w-16 border-r bg-surface-50 untouchable pointer-events-none"></div>
							{#each Array(24) as _}
								<div class="w-32 shrink-0 border-r"></div>
							{/each}
							<div class="w-16 border-r bg-surface-50 untouchable pointer-events-none"></div>
						</div>
						<div
							class="h-12 my-2 w-1 bg-red-300 rounded-full absolute z-10 top-0 -translate-x-1/2 {scheduleHovering &&
							!scheduleMenuOpened &&
							(selectedRange === 0 || !timelineSelection)
								? 'opacity-100'
								: 'opacity-0'}"
							style="left: {hoverHintLeft}px; top: {hoverHintTop}px;"
						>
							<div
								class="absolute z-20 text-center -top-11 left-1/2 shadow-md text-tertiary-600 text-sm font-semibold -translate-x-1/2 px-2 py-1 border rounded-md bg-white"
							>
								{hoveringHours}:{String(hoveringMinutes).padStart(2, '0')}
							</div>
						</div>
						<div
							class="w-4 h-16 p-0.5 absolute {selectedRange > 0 ? 'block' : 'hidden'}"
							style="left: {selectedLeft}px; top: {selectedTop}px; width: {selectedWidth}px"
						>
							<div
								class="bg-orange-100 border border-orange-200 rounded-md h-full flex overflow-hidden"
							>
								<div class="bg-orange-400 w-1"></div>
								<div
									class="absolute w-28 text-center z-20 -top-11 left-1/2 shadow-md text-tertiary-600 text-sm font-semibold -translate-x-1/2 px-2 py-1 border rounded-md bg-white"
								>
									{selectedStartHours}:{String(selectedStartMinutes).padStart(2, '0')}
									-
									{selectedEndHours}:{String(selectedEndMinutes).padStart(2, '0')}
								</div>
								<div class="bg-orange-400 w-1 ml-auto"></div>
							</div>
						</div>
						<DropdownMenu.Root
							preventScroll={false}
							bind:open={scheduleMenuOpened}
							onOpenChange={(o) => {
								if (!o) {
									cancelCreateSchedule();
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
								class="w-full max-w-40 rounded-md border border-surface-100 bg-white p-1 shadow-lg"
							>
								<DropdownMenu.Item
									on:click={createAppointment}
									class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
								>
									<div class="size-4 text-center *:block">
										<i class="fa-regular fa-calendar-check"></i>
									</div>
									<span class="font-semibold text-sm leading-4">Tạo lịch hẹn</span>
								</DropdownMenu.Item>
								<DropdownMenu.Item
									on:click={cancelCreateSchedule}
									class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-3 rounded select-none flex gap-3 items-center cursor-pointer"
								>
									<div class="size-4 text-center *:block">
										<i class="fa-regular fa-circle-xmark"></i>
									</div>
									<span class="font-semibold text-sm leading-4">Huỷ</span>
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
						<div class="pl-16 w-full r relative">
							{#each Array(10) as _}
								<div class="h-16 w-full border-b border-dashed">
									<div class="w-52 h-full p-0.5">
										<div
											class="bg-sky-100 border border-sky-200 rounded-md h-full flex overflow-hidden"
										>
											<div class="bg-sky-400 w-1"></div>
											<div class="flex-1 flex flex-col justify-center px-3 select-text">
												<p class="font-medium">Bệnh nhân A</p>
												<p class="text-xs font-semibold text-surface-400">00:00 - 01:30</p>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	.untouchable {
		background: repeating-linear-gradient(
			135deg,
			theme('colors.surface.50'),
			theme('colors.surface.50') 5px,
			theme('colors.surface.200') 5px,
			theme('colors.surface.200') 10px
		);
	}
</style>
