<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { Selected } from 'bits-ui';
	import type { Writable } from 'svelte/store';
	import endpoints from '$lib/endpoints';
	import { isEqual } from 'lodash-es';
	import DropdownSelect from '$lib/components/common/DropdownSelect.svelte';
	import { today, getLocalTimeZone, type DateValue } from '@internationalized/date';
	import Loading from '$lib/components/common/Loading.svelte';
	import { Chart, registerables } from 'chart.js';
	import { browser } from '$app/environment';
	import { fade } from 'svelte/transition';

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const patientStatisticStore = getContext<Writable<PatientStatisticSnapshot>>('patientStatistic');
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
		filterTypes.find((x) => x.value === $patientStatisticStore.query.periodType) ?? filterTypes[0];
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
		yearList.find((x) => x.value === $patientStatisticStore.query.year) ?? yearList[0];
	let selectedMonth =
		monthList.find((x) => x.value === $patientStatisticStore.query.month) ?? monthList[0];
	let dayList = getDayList(selectedYear.value, selectedMonth.value);
	let selectedDay = dayList.find((x) => x.value === $patientStatisticStore.query.day) ?? dayList[0];
	let chartCanvas: HTMLCanvasElement;
	let chart: Chart;
	let patientStatistic: PatientStatistic = {
		time: new Date(),
		ageDistribution: [],
		newPatientsCount: 0,
		patientFrequencies: []
	};

	$: dayList = getDayList(selectedYear.value, selectedMonth.value);
	$: selectedDay = dayList.find((x) => x.value === selectedDay?.value) ?? dayList[0];
	$: filtering(
		selectedFilterType.value,
		selectedYear.value,
		selectedMonth.value,
		selectedDay.value
	);
	$: patientStatisticChanged(patientStatistic);

	onMount(async () => {
		if (!browser) {
			return;
		}
		Chart.register(...registerables);
		chart = new Chart(chartCanvas, {
			type: 'bar',
			data: {
				labels: [],
				datasets: [
					{
						label: 'Số lượng bệnh nhân',
						data: [],
						borderWidth: 2,
						borderRadius: 6
					}
				]
			},
			options: {
				responsive: true,
				resizeDelay: 200,
				maintainAspectRatio: false,
				animation: false
			}
		});

		if ($patientStatisticStore.result) {
			lastestFilterOption = {
				periodType: selectedFilterType.value,
				year: selectedYear.value,
				month: selectedMonth.value,
				day: selectedDay.value
			};
			patientStatistic = await $patientStatisticStore.result;
		}
	});

	function patientStatisticChanged(patientStatistic: PatientStatistic) {
		if (!patientStatistic || !chart) {
			return;
		}
		chart.data.labels = patientStatistic.ageDistribution.map((x) => x.ageGroup);
		chart.data.datasets[0].data = patientStatistic.ageDistribution.map((x) => x.patientCount);
		chart.update();
		if (!chart.options.animation) {
			chart.options.animation = {
				duration: 500,
				easing: 'easeOutExpo'
			};
		}
	}

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

		filterTimer = setTimeout(async () => {
			if (!$userStore) {
				return;
			}

			const searchParams = new URLSearchParams();
			for (const [key, value] of Object.entries(filterOptions)) {
				searchParams.set(key, String(value));
			}
			const url = `${endpoints.statistics.patient}?${searchParams}`;

			patientStatisticStore.set({
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
					.then<ApiResponse<PatientStatistic>>(async (r) => {
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
						patientStatistic = x.body;

						return x.body;
					})
			});
		}, 0);
	}
</script>

<svelte:head>
	<title>Thống kê bệnh nhân</title>
</svelte:head>
<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Thống kê bệnh nhân</h1>
<div class="flex gap-2 items-center">
	<DropdownSelect
		items={filterTypes}
		bind:selected={selectedFilterType}
		let:ValueComponent
		regionInput="border hover:border-surface-300/70 shadow px-3"
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
				regionInput="px-3"
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
				regionInput="px-3"
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
			regionInput="px-3"
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
	<div class="grid grid-cols-3 h-60">
		<div class="flex justify-center items-center flex-col">
			<p class="text-4xl font-extrabold text-blue-600 md:text-5xl">
				{patientStatistic.newPatientsCount}
			</p>
			<p class="order-last text-lg font-medium text-gray-500 text-center">Tổng số bệnh nhân mới</p>
		</div>
		<div class="col-span-2 h-full">
			<canvas bind:this={chartCanvas}></canvas>
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
						Tên bệnh nhân
					</th>
					<th class="text-start px-4 py-2 text-sm bg-slate-100 whitespace-nowrap">Email</th>
					<th class="text-center px-4 py-2 text-sm bg-slate-100 whitespace-nowrap">
						Số điện thoại
					</th>
					<th
						class="text-center px-4 py-2 text-sm bg-slate-100 rounded-tr-container-token rounded-br-container-token"
					>
						Số lần khám
					</th>
				</tr>
			</thead>
			<tbody>
				{#each patientStatistic.patientFrequencies as patient, i (patient.id)}
					<tr class="border-b">
						<td class="text-center px-4 py-2">{i + 1}</td>
						<td class="text-start px-4 py-2">{patient.patientName ?? ''}</td>
						<td class="text-start px-4 py-2">{patient.patientEmail ?? ''}</td>
						<td class="text-center px-4 py-2">{patient.patientPhone ?? ''}</td>
						<td class="text-center px-4 py-2 font-medium">{patient.count ?? ''}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if $patientStatisticStore.result}
		{#await $patientStatisticStore.result}
			<div
				transition:fade={{ duration: 200 }}
				class="absolute top-0 left-0 right-0 bottom-0 bg-white/60 !m-0 flex justify-center items-center"
			>
				<Loading />
			</div>
		{/await}
	{/if}
</div>
