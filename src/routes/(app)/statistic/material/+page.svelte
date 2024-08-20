<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { Selected } from 'bits-ui';
	import type { Writable } from 'svelte/store';
	import endpoints from '$lib/endpoints';
	import { isEqual } from 'lodash-es';
	import DropdownSelect from '$lib/components/common/DropdownSelect.svelte';
	import { today, getLocalTimeZone } from '@internationalized/date';
	import Loading from '$lib/components/common/Loading.svelte';
	import { browser } from '$app/environment';
	import { fade } from 'svelte/transition';
	import { formatCurrency } from '$lib/helpers/formatters';
	import { toast } from 'svelte-sonner';
	import { downloadFile, handleToastFetch } from '$lib/helpers/utils';

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const materialStatisticStore =
		getContext<Writable<MaterialStatisticSnapshot>>('materialStatistic');
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
		filterTypes.find((x) => x.value === $materialStatisticStore.query.periodType) ?? filterTypes[0];
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
		yearList.find((x) => x.value === $materialStatisticStore.query.year) ?? yearList[0];
	let selectedMonth =
		monthList.find((x) => x.value === $materialStatisticStore.query.month) ?? monthList[0];
	let dayList = getDayList(selectedYear.value, selectedMonth.value);
	let selectedDay =
		dayList.find((x) => x.value === $materialStatisticStore.query.day) ?? dayList[0];
	let materialStatistics: MaterialStatistic[] = [];
	let materialName = $materialStatisticStore.query.materialName ?? '';

	$: dayList = getDayList(selectedYear.value, selectedMonth.value);
	$: selectedDay = dayList.find((x) => x.value === selectedDay?.value) ?? dayList[0];
	$: filtering(
		selectedFilterType.value,
		selectedYear.value,
		selectedMonth.value,
		selectedDay.value,
		materialName
	);

	onMount(async () => {
		if (!browser || !$materialStatisticStore.result) {
			return;
		}

		lastestFilterOption = $materialStatisticStore.query;
		materialStatistics = await $materialStatisticStore.result;
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
		materialName = '';
	}

	async function filtering(
		periodType: 'year' | 'month' | 'day',
		year: number,
		month: number,
		day: number,
		materialName: string,
		forceFilter: boolean = false
	) {
		if (filterTimer) {
			clearTimeout(filterTimer);
		}

		const filterOptions = {
			periodType,
			year,
			month,
			day,
			materialName: materialName.trim()
		};
		let delay = 0;

		if (!forceFilter && isEqual(lastestFilterOption, filterOptions)) {
			return;
		}

		if (lastestFilterOption && lastestFilterOption.materialName !== filterOptions.materialName) {
			delay = 1000;
		}

		filterTimer = setTimeout(async () => {
			if (!$userStore) {
				return;
			}

			const searchParams = new URLSearchParams();
			for (const [key, value] of Object.entries(filterOptions)) {
				searchParams.set(key, String(value));
			}
			const url = `${endpoints.statistics.material}?${searchParams}`;

			materialStatisticStore.set({
				query: {
					periodType,
					year,
					month,
					day,
					materialName
				},
				result: fetch(url, {
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				})
					.then<ApiResponse<MaterialStatistic[]>>(async (r) => {
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
						materialStatistics = x.body;

						return x.body;
					})
			});
		}, delay);
	}

	async function downloadExport() {
		if (!$userStore) {
			return;
		}
		toast.promise(
			handleToastFetch(
				() => {
					const filterOptions = {
						periodType: selectedFilterType.value,
						year: selectedYear.value,
						month: selectedMonth.value,
						day: selectedDay.value,
						materialName: materialName.trim()
					};
					const searchParams = new URLSearchParams();
					for (const [key, value] of Object.entries(filterOptions)) {
						searchParams.set(key, String(value));
					}
					const url = `${endpoints.statistics.exportMaterial}?${searchParams}`;
					return fetch(url, {
						headers: {
							'content-type': 'application/json',
							Authorization: `Bearer ${$userStore.token}`
						}
					});
				},
				{ success: 'Tải thống kê thành công' },
				async (response) => {
					downloadFile(await response.blob(), 'material-statistic.csv');
				}
			),
			{
				loading: 'Đang tải...',
				success: (msg) => msg ?? 'Tải thống kê thành công',
				error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình tải kết quả thống kê'
			}
		);
	}
</script>

<svelte:head>
	<title>Thống kê vật tư</title>
</svelte:head>
<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Thống kê vật tư</h1>
<div class="flex gap-6 items-center overflow-auto">
	<div class="relative max-w-56 min-w-40">
		<input
			type="text"
			bind:value={materialName}
			class="input rounded-container-token shadow {materialName.trim() ? 'pr-12' : ''}"
			placeholder="Tên vật tư..."
		/>
		{#if materialName.trim()}
			<div
				transition:fade={{ duration: 200 }}
				class="absolute right-0 top-0 bottom-0 aspect-square flex justify-center items-center"
			>
				<button type="button" class="size-6 btn p-0" on:click={() => (materialName = '')}>
					<i class="fa-solid fa-xmark"></i>
				</button>
			</div>
		{/if}
	</div>
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
	<div class="flex justify-center items-center gap-2">
		<span class="font-semibold text-sm text-end leading-4 whitespace-nowrap"
			>Mốc thời <br /> gian:</span
		>
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
	</div>
	<button
		type="button"
		class="btn-icon variant-filled-tertiary rounded-container-token ml-auto flex-shrink-0"
		on:click={reload}
	>
		<i class="fa-solid fa-rotate-left"></i>
	</button>
</div>
<div class="border-b pt-4 mb-4"></div>
<div class="space-y-6 @container relative">
	<div class="pb-6 overflow-auto">
		<table class="w-full">
			<thead>
				<tr>
					<th
						class="text-center px-4 py-2 text-sm bg-slate-100 rounded-tl-container-token rounded-bl-container-token"
					>
						#
					</th>
					<th class="text-start px-4 py-2 text-sm bg-slate-100 whitespace-nowrap min-w-40">
						Tên vật liệu
					</th>
					<th class="text-end px-4 py-2 text-sm bg-slate-100 whitespace-nowrap">Số lượng nhập</th>
					<th class="text-end px-4 py-2 text-sm bg-slate-100 whitespace-nowrap">Giá trị nhập</th>
					<th class="text-end px-4 py-2 text-sm bg-slate-100 whitespace-nowrap">Số lượng xuất</th>
					<th class="text-end px-4 py-2 text-sm bg-slate-100 whitespace-nowrap">
						Số lượng hết hạn
					</th>
					<th
						class="text-end px-4 py-2 text-sm bg-slate-100 whitespace-nowrap rounded-tr-container-token rounded-br-container-token"
					>
						Số khả dụng
					</th>
				</tr>
			</thead>
			<tbody>
				{#each materialStatistics as material, i (material.materialId)}
					<tr class="border-b">
						<td class="text-center px-4 py-2">{i + 1}</td>
						<td class="text-start px-4 py-2">{material.materialName ?? ''}</td>
						<td class="text-end px-4 py-2">{material.importQuantity ?? ''}</td>
						<td class="text-end px-4 py-2">{formatCurrency(material.importValue)}</td>
						<td class="text-end px-4 py-2">{material.exportQuantity ?? ''}</td>
						<td class="text-end px-4 py-2">{material.expireQuantity ?? ''}</td>
						<td class="text-end px-4 py-2">{material.availableQuantity ?? ''}</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<button
			type="button"
			class="anchor font-medium text-sm ml-auto block w-fit mt-2"
			on:click={downloadExport}
		>
			Tải về thống kê xuất vật tư.
		</button>
	</div>
	{#if $materialStatisticStore.result}
		{#await $materialStatisticStore.result}
			<div
				transition:fade={{ duration: 200 }}
				class="absolute top-0 left-0 right-0 bottom-0 bg-white/60 !m-0 flex justify-center items-center"
			>
				<Loading />
			</div>
		{/await}
	{/if}
</div>
