<script lang="ts">
	import { page } from '$app/stores';
	import Breadcrumb from '$lib/components/common/Breadcrumb.svelte';
	import Container from '$lib/components/common/Container.svelte';
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';

	const patientStatisticStore = writable<PatientStatisticSnapshot>({
		query: {
			periodType: 'year',
			year: 0,
			month: 0,
			day: 0
		}
	});
	const scheduleStatisticStore = writable<ScheduleStatisticSnapshot>({
		query: {
			periodType: 'year',
			year: 0,
			month: 0,
			day: 0
		}
	});

	setContext('patientStatistic', patientStatisticStore);
	setContext('scheduleStatistic', scheduleStatisticStore);
</script>

<Container paddingTopHeader class="py-4">
	<Breadcrumb crumbs={[{ label: 'Thống kê' }]} highlight />
	<div class="rounded-2xl bg-white shadow-md p-4 border">
		<div class="flex items-center gap-4">
			<span class="text-sm font-semibold text-surface-500">
				Mục
				<br />
				thống kê:
			</span>
			<div class="bg-slate-300 p-1 rounded-lg flex gap-x-1 flex-1">
				<a
					href="/statistic/patient"
					class="rounded-md h-10 flex-1 flex-shrink-0 font-semibold flex items-center justify-center {$page
						.route.id === '/(app)/statistic/patient'
						? 'bg-white shadow'
						: 'text-black/70'}"
				>
					Bệnh nhân
				</a>
				<a
					href="/statistic/schedule"
					class="rounded-md h-10 flex-1 flex-shrink-0 font-semibold flex items-center justify-center {$page
						.route.id === '/(app)/statistic/schedule'
						? 'bg-white shadow'
						: 'text-black/70'}"
				>
					Lịch khám
				</a>
			</div>
		</div>
		<slot />
	</div>
</Container>
