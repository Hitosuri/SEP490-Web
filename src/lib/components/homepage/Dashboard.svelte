<script lang="ts">
	import FunctionCard from '$lib/components/homepage/FunctionCard.svelte';
	import endpoints from '$lib/endpoints';
	import { formatHourMinute } from '$lib/helpers/formatters';
	import { MinuteTick } from '$lib/helpers/minute-tick';
	import { getContext, onDestroy, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	let patientQueue: QueueItem[] | undefined = undefined;
	let lastDataTime: Date = new Date();

	$: console.log(patientQueue);

	onMount(async () => {
		await getPatientQueue();
		lastDataTime = new Date();
		MinuteTick.addEvent(getPatientQueue);
	});

	onDestroy(() => {
		MinuteTick.removeEvent(getPatientQueue);
	});

	async function getPatientQueue() {
		const r = await fetch(endpoints.queue.get, {
			headers: {
				Authorization: `Bearer ${$userStore?.token}`
			}
		});

		if (!r.ok) {
			return;
		}

		const data: ApiResponse<QueueItem[]> = await r.json();

		if (!data.body) {
			return;
		}

		patientQueue = data.body;
		lastDataTime = new Date();
	}
</script>

<svelte:head>
	<title>Bảng chức năng - Nha khoa Trịnh</title>
</svelte:head>
<div class="bg-stone-50 min-h-screen">
	<div class="pt-[5.5rem] container mx-auto">
		<div class="flex gap-8 p-4">
			<div
				class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 p-4 border rounded-xl flex-1 flex-shrink-0 bg-white"
			>
				<FunctionCard
					lottieAnimUrl="/images/animations/user.lottie"
					title="Nhân viên"
					class="from-sky-400 to-indigo-400"
					href="/users"
				/>
				<FunctionCard
					lottieAnimUrl="/images/animations/treatment.lottie"
					title="Phương pháp trị liệu"
					class="from-yellow-400 to-orange-400"
				/>
				<FunctionCard
					lottieAnimUrl="/images/animations/material.lottie"
					title="Thuốc/Dụng cụ"
					class="from-indigo-400 to-purple-400"
					href="/materials"
				/>
				<FunctionCard
					lottieAnimUrl="/images/animations/patient.lottie"
					title="Bệnh nhân"
					class="from-pink-400 to-red-400"
					href="/patients"
				/>
				<FunctionCard
					lottieAnimUrl="/images/animations/schedule.lottie"
					title="Đặt lịch"
					class="from-emerald-400 to-lime-400"
					href="/schedule"
				/>
			</div>
			<div class="flex-1 flex-shrink-0">
				<div class="border rounded-xl bg-white h-fit overflow-hidden">
					<p class="text-2xl font-semibold py-4 px-6 bg-tertiary-500 text-white">
						Danh sách chờ khám hôm nay
					</p>
					<div>
						<table class="w-full">
							<thead>
								<tr class="text-sm font-semibold">
									<th class="py-2 px-4 border-r"> # </th>
									<th class="py-2 px-4 text-start border-r"> Tên bệnh nhân </th>
									<th class="py-2 px-4 text-start"> Lý do khám </th>
								</tr>
							</thead>
							<tbody>
								{#if patientQueue}
									{#each patientQueue as queueItem, i (queueItem.id)}
										<tr
											class="group cursor-pointer odd:bg-slate-50 border-t hover:bg-primary-50"
											on:click={() => {
												console.log(queueItem);
											}}
										>
											<td class="p-0 border-r group-hover:border-primary-300">
												<a
													href="/records/{queueItem.id}"
													class="block px-4 py-4 text-center font-semibold"
												>
													{i + 1}
												</a>
											</td>
											<td class="p-0 border-r group-hover:border-primary-300">
												<a href="/records/{queueItem.id}" class="block px-4 py-4">
													{queueItem.patientName}
												</a>
											</td>
											<td class="p-0">
												<a href="/records/{queueItem.id}" class="block px-4 py-4">
													{queueItem.reason}
												</a>
											</td>
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
						{#if !patientQueue}
							<h3 class="h3 font-semibold text-center text-surface-400 py-4 border-t">Đang tải thông tin</h3>
						{/if}
						{#if patientQueue?.length === 0}
							<h3 class="h3 font-semibold text-center text-tertiary-500 py-4 border-t">Danh sách trống</h3>
						{/if}
					</div>
				</div>
				{#if patientQueue}
					<p class="text-end text-xs mt-2">
						Dữ liệu được lấy lúc {formatHourMinute(lastDataTime)}
					</p>
				{/if}
			</div>
		</div>
	</div>
</div>
