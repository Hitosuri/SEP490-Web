<script lang="ts">
	import { Role } from '$lib/helpers/authorization';
	import FunctionCard from '$lib/components/homepage/FunctionCard.svelte';
	import endpoints from '$lib/endpoints';
	import { formatHourMinute } from '$lib/helpers/formatters';
	import { MinuteTick } from '$lib/helpers/minute-tick';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import { getContext, onDestroy, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { Writable } from 'svelte/store';
	import Container from '../common/Container.svelte';
	import { scheduleStepInMinute } from '$lib/constants/schedule-constant';
	import { userFeatureDetails } from '$lib/constants/user-feature-constant';
	import { browser } from '$app/environment';
	import { intersection } from 'lodash-es';

	const modalStore = getModalStore();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const stepInMiliseconds = 1000 * 60 * scheduleStepInMinute;
	let patientQueue: QueueItem[] | undefined = undefined;
	let lastDataTime: Date = new Date();
	const allFeature = Object.values(userFeatureDetails);

	$: timeToNextPatient =
		!patientQueue || patientQueue.length === 0
			? undefined
			: patientQueue[0].startAt.getTime() - new Date().getTime();
	$: canPullSchedule = Boolean(timeToNextPatient && timeToNextPatient > 0);
	$: firstPatientReady = Boolean(timeToNextPatient && timeToNextPatient <= 0);

	onMount(async () => {
		if (browser && $userStore?.roles.includes(Role.Doctor)) {
			await getPatientQueue();
			MinuteTick.addEvent(getPatientQueue);
		}
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

		data.body.forEach((x) => {
			x.startAt = new Date(x.startAt);
			x.endAt = new Date(x.endAt);
		});
		data.body.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

		patientQueue = data.body;
		lastDataTime = new Date();
	}

	function pullSchedule() {
		if (!$userStore?.roles.includes(Role.Doctor) || !patientQueue?.[0]) {
			return;
		}
		const nextPatient = patientQueue[0];
		const newStartAt = new Date();
		const newMinutes = Math.ceil(newStartAt.getMinutes() / 15) * 15;
		newStartAt.setMinutes(newMinutes);

		const modalSetting: ModalSettings = {
			type: 'confirm',
			title: 'Xác nhận thay đổi thời gian',
			body: `Vui lòng xác nhận thay đổi thời gian bắt đầu lịch hẹn của bệnh nhân ${nextPatient.patientName} từ ${formatHourMinute(nextPatient.startAt)} thành ${formatHourMinute(newStartAt)}`,
			response: (r) => {
				if (!r || !$userStore) {
					return;
				}

				toast.promise(
					async (): Promise<string> => {
						const response = await fetch(endpoints.schedule.pullSchedule($userStore.id), {
							method: 'PUT',
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
						getPatientQueue();
						return 'Cập nhật lịch hẹn thành công';
					},
					{
						loading: 'Đang xử lý...',
						success: (msg) => msg ?? 'Cập nhật lịch hẹn thành công',
						error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình cập nhật lịch hẹn'
					}
				);
			}
		};
		modalStore.trigger(modalSetting);
	}
</script>

<svelte:head>
	<title>Bảng chức năng - Nha khoa Trịnh</title>
</svelte:head>
<Container paddingTopHeader class="pt-4 flex flex-col-reverse gap-4 p-4">
	<div
		class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 p-4 border rounded-xl flex-1 flex-shrink-0 bg-white"
	>
		{#each allFeature as featureDetail (featureDetail.id)}
			{#if $userStore && (!featureDetail.roles || intersection(featureDetail.roles, $userStore.roles).length > 0)}
				<FunctionCard
					lottieAnimUrl={featureDetail.lottieAnim}
					title={featureDetail.title}
					class={featureDetail.class}
					href={featureDetail.url}
				/>
			{/if}
		{/each}
	</div>
	{#if $userStore?.roles.includes(Role.Doctor)}
		<div class="flex-1 flex-shrink-0">
			<div class="border rounded-xl bg-white h-fit overflow-hidden">
				<div class="py-4 px-6 bg-tertiary-500 flex justify-between items-center">
					<span class="text-2xl font-semibold text-white">Danh sách chờ khám</span>
					{#if canPullSchedule}
						<button
							type="button"
							class="btn ring-4 ring-white py-1.5 px-3 text-white font-bold hover:bg-white/10"
							on:click={pullSchedule}>Gọi bệnh nhân tiếp theo</button
						>
					{/if}
				</div>
				<div>
					<table class="w-full">
						<thead>
							<tr class="text-sm font-semibold">
								<th class="py-2 px-4 border-r">#</th>
								<th class="py-2 px-4 text-start border-r">Tên bệnh nhân</th>
								<th class="py-2 px-4 text-start border-r">Thời gian khám</th>
								<th class="py-2 px-4 text-start">Lý do khám</th>
							</tr>
						</thead>
						<tbody>
							{#if patientQueue}
								{#each patientQueue as queueItem, i (queueItem.id)}
									{@const showLink = i === 0 && firstPatientReady}
									{@const elementTag = showLink ? 'a' : 'div'}
									<tr
										class="group odd:bg-slate-50 border-t {showLink
											? 'hover:bg-gradient-to-r from-sky-100  to-teal-100 cursor-pointer font-bold'
											: ''}"
									>
										<td
											class="p-0 border-r {showLink
												? 'group-hover:border-primary-300 text-primary-700'
												: ''}"
										>
											<svelte:element
												this={elementTag}
												href="/records/{queueItem.id}"
												class="block px-4 py-4 text-center font-semibold"
											>
												{i + 1}
											</svelte:element>
										</td>
										<td
											class="p-0 border-r {showLink
												? 'group-hover:border-primary-300 text-primary-700'
												: ''}"
										>
											<svelte:element
												this={elementTag}
												href="/records/{queueItem.id}"
												class="block px-4 py-4"
											>
												{queueItem.patientName}
											</svelte:element>
										</td>
										<td
											class="p-0 border-r {showLink
												? 'group-hover:border-primary-300 text-primary-700'
												: ''}"
										>
											<svelte:element
												this={elementTag}
												href="/records/{queueItem.id}"
												class="block px-4 py-4"
											>
												{formatHourMinute(queueItem.startAt)}
												-
												{formatHourMinute(queueItem.endAt)}
											</svelte:element>
										</td>
										<td class="p-0 {showLink ? 'text-primary-700' : ''}">
											<svelte:element
												this={elementTag}
												href="/records/{queueItem.id}"
												class="block px-4 py-4"
											>
												{queueItem.reason}
											</svelte:element>
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
					{#if !patientQueue}
						<h3 class="h3 font-semibold text-center text-surface-400 py-4 border-t">
							Đang tải thông tin
						</h3>
					{/if}
					{#if patientQueue?.length === 0}
						<h3 class="h3 font-semibold text-center text-tertiary-500 py-4 border-t">
							Danh sách trống
						</h3>
					{/if}
				</div>
			</div>
			{#if patientQueue}
				<p class="text-end text-xs mt-2">
					Dữ liệu được lấy lúc {formatHourMinute(lastDataTime)}
				</p>
			{/if}
		</div>
	{/if}
</Container>
