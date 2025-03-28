<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { Selected } from 'bits-ui';
	import type { Writable } from 'svelte/store';
	import endpoints from '$lib/endpoints';
	import { isEqual } from 'lodash-es';
	import DropdownSelect from '$lib/components/common/DropdownSelect.svelte';
	import { today, getLocalTimeZone, type DateValue } from '@internationalized/date';
	import Loading from '$lib/components/common/Loading.svelte';
	import { browser } from '$app/environment';
	import { fade } from 'svelte/transition';

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const scheduleStatisticStore =
		getContext<Writable<ScheduleStatisticSnapshot>>('scheduleStatistic');
	const filterTypes: Selected<'year' | 'month' | 'day'>[] = [
		{
			value: 'year',
			label: 'Năm'
		},
		{
			value: 'month',
			label: 'Tháng'
		},
		{
			value: 'day',
			label: 'Ngày'
		}
	];
	let selectedFilterType =
		filterTypes.find((x) => x.value === $scheduleStatisticStore.query.periodType) ?? filterTypes[0];
	let filterTimer: NodeJS.Timeout;
	let lastestFilterOption: Record<string, string | number>;
	let currentDate = today(getLocalTimeZone());
	let yearList: Selected<number>[] = Array<number>(20)
		.fill(currentDate.year)
		.map((x, i) => ({
			value: x - i,
			label: String(x - i)
		}));
	let monthList: Selected<number>[] = Array<number>(12)
		.fill(1)
		.map((x, i) => ({
			value: x + i,
			label: String(x + i)
		}));
	let selectedYear =
		yearList.find((x) => x.value === $scheduleStatisticStore.query.year) ?? yearList[0];
	let selectedMonth =
		monthList.find((x) => x.value === $scheduleStatisticStore.query.month) ?? monthList[0];
	let dayList = getDayList(selectedYear.value, selectedMonth.value);
	let selectedDay =
		dayList.find((x) => x.value === $scheduleStatisticStore.query.day) ?? dayList[0];
	let scheduleStatistic: ScheduleStatistic = {
		time: new Date(),
		countSchedule: {
			cancelSchedule: 0,
			completedSchedule: 0
		},
		frequencyOfDoctors: []
	};
	let forceFilter = false;

	$: dayList = getDayList(selectedYear.value, selectedMonth.value);
	$: selectedDay = dayList.find((x) => x.value === selectedDay?.value) ?? dayList[0];
	$: filtering(
		selectedFilterType.value,
		selectedYear.value,
		selectedMonth.value,
		selectedDay.value,
		forceFilter
	);

	onMount(async () => {
		if (!browser || !$scheduleStatisticStore.result) {
			return;
		}

		lastestFilterOption = {
			periodType: selectedFilterType.value,
			year: selectedYear.value,
			month: selectedMonth.value,
			day: selectedDay.value
		};
		scheduleStatistic = await $scheduleStatisticStore.result;
	});

	function getDayList(year: number, month: number): Selected<number>[] {
		const maxDay = new Date(year, month, 0).getDate();
		return Array<number>(maxDay)
			.fill(1)
			.map((x, i) => ({
				value: x + i,
				label: String(x + i)
			}));
	}

	function reload() {
		selectedYear = yearList[0];
		selectedMonth = monthList[0];
		selectedDay = monthList[0];
		selectedFilterType = filterTypes[0];
		forceFilter = true;
	}

	async function filtering(
		periodType: 'year' | 'month' | 'day',
		year: number,
		month: number,
		day: number,
		forceFilter: boolean = false
	) {
		if (filterTimer) {
			clearTimeout(filterTimer);
		}

		const filterOptions: Record<string, string | number> = {
			periodType,
			year,
			month,
			day
		};

		if (!forceFilter && isEqual(lastestFilterOption, filterOptions)) {
			return;
		}
		forceFilter = false;

		filterTimer = setTimeout(async () => {
			if (!$userStore) {
				return;
			}

			const searchParams = new URLSearchParams();
			for (const [key, value] of Object.entries(filterOptions)) {
				searchParams.set(key, String(value));
			}
			const url = `${endpoints.statistics.scheduleAndDoctor}?${searchParams}`;

			scheduleStatisticStore.set({
				query: {
					periodType,
					year,
					month,
					day
				},
				result: fetch(url, {
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				})
					.then<ApiResponse<ScheduleStatistic>>(async (r) => {
						if (!r.ok) {
							const data = await r.json();
							if (typeof data?.error === 'string') {
								return Promise.reject(data?.error);
							} else if (Array.isArray(data?.error) || Array.isArray(data)) {
								const msg = (data?.error ?? data).join(', ');
								return Promise.reject(msg);
							}

							return Promise.reject();
						}
						return r.json();
					})
					.then((x) => {
						if (!x.body) {
							return Promise.reject('Đã có lỗi xảy ra');
						}

						lastestFilterOption = filterOptions;
						x.body.time = new Date(x.body.time);
						scheduleStatistic = x.body;

						return x.body;
					})
			});
		}, 0);
	}
</script>

<svelte:head>
	<title>Thống kê lịch khám</title>
</svelte:head>
<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Thống kê lịch khám</h1>
<div class="flex gap-2 items-center">
	<DropdownSelect
		items={filterTypes}
		bind:selected={selectedFilterType}
		let:ValueComponent
		regionInput="border hover:border-surface-300/70 shadow px-3 py-2"
	>
		<i class="fa-regular fa-filter text-surface-300"></i>
		<span class="pl-1 text-sm font-medium">Thống kê theo:</span>
		<ValueComponent class="font-semibold" />
		<div class="flex flex-col text-[0.55rem] pl-1 text-surface-400">
			<i class="fa-solid fa-chevron-up"></i>
			<i class="fa-solid fa-chevron-down"></i>
		</div>
	</DropdownSelect>
	<span class="font-semibold text-sm text-end pl-8 leading-4">Mốc thời <br /> gian:</span>
	<div class="flex border shadow rounded-md">
		{#if selectedFilterType?.value === 'day'}
			<DropdownSelect
				items={dayList}
				bind:selected={selectedDay}
				let:ValueComponent
				regionContent="max-h-60 overflow-auto"
				regionInput="px-3 py-2"
			>
				<span class="text-sm font-medium">Ngày:</span>
				<ValueComponent class="font-semibold" />
				<div class="flex flex-col text-[0.55rem] pl-1 text-surface-400">
					<i class="fa-solid fa-chevron-up"></i>
					<i class="fa-solid fa-chevron-down"></i>
				</div>
			</DropdownSelect>
			<div class="border-r h-auto"></div>
		{/if}
		{#if selectedFilterType?.value === 'month' || selectedFilterType?.value === 'day'}
			<DropdownSelect
				items={monthList}
				bind:selected={selectedMonth}
				let:ValueComponent
				regionContent="max-h-60 overflow-auto"
				regionInput="px-3 py-2"
			>
				<span class="text-sm font-medium">Tháng:</span>
				<ValueComponent class="font-semibold" />
				<div class="flex flex-col text-[0.55rem] pl-1 text-surface-400">
					<i class="fa-solid fa-chevron-up"></i>
					<i class="fa-solid fa-chevron-down"></i>
				</div>
			</DropdownSelect>
			<div class="border-r h-auto"></div>
		{/if}
		<DropdownSelect
			items={yearList}
			bind:selected={selectedYear}
			let:ValueComponent
			regionInput="px-3 py-2"
			regionContent="max-h-60 overflow-auto"
		>
			<span class="text-sm font-medium">Năm:</span>
			<ValueComponent class="font-semibold" />
			<div class="flex flex-col text-[0.55rem] pl-1 text-surface-400">
				<i class="fa-solid fa-chevron-up"></i>
				<i class="fa-solid fa-chevron-down"></i>
			</div>
		</DropdownSelect>
	</div>
	<button
		type="button"
		class="btn-icon variant-filled-tertiary rounded-container-token ml-auto"
		on:click={reload}
	>
		<i class="fa-solid fa-rotate-left"></i>
	</button>
</div>
<div class="border-b pt-4 mb-4"></div>
<div class="space-y-6 @container relative">
	<div class="grid grid-cols-2 h-60">
		<div class="flex justify-center items-center flex-col">
			<p class="text-4xl font-extrabold text-blue-600 md:text-5xl">
				{scheduleStatistic.countSchedule.completedSchedule}
			</p>
			<p class="order-last text-lg font-medium text-gray-500 text-center">
				Số lịch khám thành công
			</p>
		</div>
		<div class="flex justify-center items-center flex-col">
			<p class="text-4xl font-extrabold text-blue-600 md:text-5xl">
				{scheduleStatistic.countSchedule.cancelSchedule}
			</p>
			<p class="order-last text-lg font-medium text-gray-500 text-center">Số lịch khám thất bại</p>
		</div>
	</div>
	<div class="pb-6 w-full @3xl:w-5/6 mx-auto @5xl:w-4/5 overflow-auto">
		<table class="w-full">
			<thead>
				<tr>
					<th
						class="text-center px-4 py-2 text-sm bg-slate-100 rounded-tl-container-token rounded-bl-container-token"
					>
						#
					</th>
					<th class="text-start px-4 py-2 text-sm bg-slate-100 whitespace-nowrap min-w-40">
						Tên bác sĩ
					</th>
					<th class="text-center px-4 py-2 text-sm bg-slate-100 whitespace-nowrap">
						Số điện thoại
					</th>
					<th
						class="text-center px-4 py-2 text-sm bg-slate-100 rounded-tr-container-token rounded-br-container-token"
					>
						Số ca khám
					</th>
				</tr>
			</thead>
			<tbody>
				{#each scheduleStatistic.frequencyOfDoctors as doctor, i (doctor.id)}
					<tr class="border-b">
						<td class="text-center px-4 py-2">{i + 1}</td>
						<td class="text-start px-4 py-2">{doctor.name ?? ''}</td>
						<td class="text-center px-4 py-2">{doctor.phone ?? ''}</td>
						<td class="text-center px-4 py-2 font-medium">{doctor.frequency ?? ''}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if $scheduleStatisticStore.result}
		{#await $scheduleStatisticStore.result}
			<div
				transition:fade={{ duration: 200 }}
				class="absolute top-0 left-0 right-0 bottom-0 bg-white/60 !m-0 flex justify-center items-center"
			>
				<Loading />
			</div>
		{/await}
	{/if}
</div>
