<script lang="ts">
	import { formatCompactDate, formatCompactDateTime } from '$lib/helpers/formatters';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';
	import { setError, superForm } from 'sveltekit-superforms';
	import { editPatientSchema } from '$lib/form-schemas/edit-patient-schema';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import endpoints from '$lib/endpoints';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { CalendarDate } from '@internationalized/date';
	import { getContext, type ComponentEvents } from 'svelte';
	import { fly } from 'svelte/transition';
	import Breadcrumb from '$lib/components/common/Breadcrumb.svelte';
	import { type Writable } from 'svelte/store';
	import { Tooltip } from 'bits-ui';
	import { cubicOut } from 'svelte/easing';
	import { recordStatusInfo } from '$lib/constants/record-constant';

	export let data: PageData;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	let patient = data.patient;
	let records = data.records;

	const form = superForm(data.editPatientForm, {
		validators: zodClient(editPatientSchema),
		resetForm: false,
		SPA: true,
		onUpdate: ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}

			toast.promise(
				async () => {
					const response = await fetch(endpoints.patients.edit(patient.id), {
						method: 'PUT',
						headers: {
							'content-type': 'application/json',
							Authorization: `Bearer ${$userStore.token}`
						},
						body: JSON.stringify(form.data)
					});

					if (!response.ok) {
						const responseJson = await response.json();
						let msg = '';
						if (Array.isArray(responseJson?.error)) {
							msg = responseJson.error.join(', ');
							const firstError = responseJson?.error[0];
							if (typeof firstError === 'string') {
								if (firstError.startsWith('Bệnh nhân với số điện thoại')) {
									setError(form, 'phone', firstError);
								} else if (firstError.startsWith('Bệnh nhân với Email ')) {
									setError(form, 'email', firstError);
								}
							}
						}
						return Promise.reject(msg);
					}
					editting = false;
					patient.name = form.data.name;
					patient.phone = form.data.phone;
					patient.email = form.data.email;
					patient.birthday = form.data.birthday;
				},
				{
					loading: 'Đang xử lý...',
					success: 'Cập nhật thông tin bệnh nhân thành công',
					error: (msg) =>
						String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình cập nhật thông tin bệnh nhân'
				}
			);
		}
	});
	const { form: formData, enhance } = form;
	const today = new Date();
	let requesting = false;
	let editting = false;

	$: setDefaultData(patient);

	function setDefaultData(patient: Patient) {
		$formData.name = patient.name ?? undefined;
		$formData.phone = patient.phone ?? undefined;
		$formData.email = patient.email ?? undefined;
		$formData.birthday = patient.birthday ?? undefined;
	}

	function birthdayChanged(e: ComponentEvents<DatePicker>['valueChange']) {
		if (e.detail) {
			e.detail.setMinutes(e.detail.getMinutes() - e.detail.getTimezoneOffset());
			$formData.birthday = e.detail;
		} else {
			$formData.birthday = undefined;
		}
	}
</script>

<svelte:head>
	<title>Bệnh nhân {patient.name ?? ''}</title>
</svelte:head>
<div class="pt-header bg-stone-100 min-h-screen">
	<div class="container mx-auto p-4 pb-8">
		<Breadcrumb
			crumbs={[
				{ label: 'Danh sách bệnh nhân', href: '/patients' },
				{ label: patient.name ?? 'Chưa có tên' }
			]}
			highlight
		/>
		<div class="grid grid-cols-12 gap-8">
			<div class="col-span-5">
				<p class="text-2xl font-semibold p-4">Thông tin bệnh nhân</p>
				<form
					method="post"
					use:enhance
					class="bg-white rounded-container-token shadow-md p-4 transition-all overflow-hidden duration-300 relative {editting
						? 'h-[480px]'
						: 'h-60'}"
				>
					<div class="grid grid-cols-[auto_1fr] gap-x-6 {editting ? 'gap-y-1' : 'gap-y-3'}">
						<div class="font-medium text-surface-500">Họ và tên:</div>
						<div class="text-end font-semibold">{patient.name ?? ''}</div>
						{#if editting}
							<div class="col-span-2 pb-2">
								<Field {form} name="name">
									<Control let:attrs>
										<div class="flex">
											<div
												class="border-t border-l border-b w-14 border-surface-500/40 rounded-tl-container-token rounded-bl-container-token text-center bg-surface-100 flex-shrink-0"
											>
												<i class="fa-solid fa-user-pen leading-10"></i>
											</div>
											<input
												{...attrs}
												type="text"
												placeholder="Tên bệnh nhân..."
												class="input rounded-[unset] !rounded-tr-container-token !rounded-br-container-token flex-1"
												bind:value={$formData.name}
											/>
										</div>
									</Control>
									<FieldErrors class="text-sm mt-1" />
								</Field>
							</div>
						{/if}
						<div class="font-medium text-surface-500">Số điện thoại:</div>
						<div class="text-end font-semibold">{patient.phone ?? ''}</div>
						{#if editting}
							<div class="col-span-2 pb-2">
								<Field {form} name="phone">
									<Control let:attrs>
										<div class="flex">
											<div
												class="border-t border-l border-b w-14 border-surface-500/40 rounded-tl-container-token rounded-bl-container-token text-center bg-surface-100 flex-shrink-0"
											>
												<i class="fa-solid fa-phone leading-10"></i>
											</div>
											<input
												{...attrs}
												type="text"
												placeholder="Tên bệnh nhân..."
												class="input rounded-[unset] !rounded-tr-container-token !rounded-br-container-token flex-1"
												bind:value={$formData.phone}
											/>
										</div>
									</Control>
									<FieldErrors class="text-sm mt-1" />
								</Field>
							</div>
						{/if}
						<div class="font-medium text-surface-500">Ngày sinh:</div>
						<div class="text-end font-semibold">{formatCompactDate(patient.birthday)}</div>
						{#if editting}
							<div class="col-span-2 pb-2">
								<Field {form} name="birthday">
									<Control>
										<div class="flex">
											<div
												class="border-t border-l border-b w-14 border-surface-500/40 rounded-tl-container-token rounded-bl-container-token text-center bg-surface-100 flex-shrink-0"
											>
												<i class="fa-solid fa-cake-candles leading-10"></i>
											</div>
											<DatePicker
												regionInput="flex-1 !rounded-[unset] !rounded-tr-container-token !rounded-br-container-token"
												on:valueChange={birthdayChanged}
												maxValue={new CalendarDate(
													today.getFullYear(),
													today.getMonth() + 1,
													today.getDate()
												)}
												initValue={$formData.birthday}
											/>
										</div>
									</Control>
									<FieldErrors class="text-sm mt-1" />
								</Field>
							</div>
						{/if}
						<div class="font-medium text-surface-500">Email:</div>
						<div class="text-end font-semibold">{patient.email ?? ''}</div>
						{#if editting}
							<div class="col-span-2 pb-2">
								<Field {form} name="email">
									<Control let:attrs>
										<div class="flex">
											<div
												class="border-t border-l border-b w-14 border-surface-500/40 rounded-tl-container-token rounded-bl-container-token text-center bg-surface-100 flex-shrink-0"
											>
												<i class="fa-solid fa-phone leading-10"></i>
											</div>
											<input
												{...attrs}
												type="email"
												placeholder="Tên bệnh nhân..."
												class="input rounded-[unset] !rounded-tr-container-token !rounded-br-container-token flex-1"
												bind:value={$formData.email}
											/>
										</div>
									</Control>
									<FieldErrors class="text-sm mt-1" />
								</Field>
							</div>
						{/if}
					</div>
					<div class="bg-white w-full absolute left-0 bottom-0">
						{#if editting}
							<div
								class="p-4 flex gap-2 justify-end font-medium"
								transition:fly={{ duration: 300, x: 80 }}
							>
								<button
									on:click={() => {
										editting = false;
										setDefaultData(patient);
									}}
									type="button"
									class="btn flex-1 rounded-container-token variant-soft-error"
								>
									Huỷ
								</button>
								<button
									type="submit"
									class="btn flex-1 rounded-container-token variant-filled-primary"
								>
									Cập nhật
								</button>
							</div>
						{:else}
							<div
								class="p-4 flex gap-2 justify-end font-medium absolute left-0 bottom-0 w-full"
								transition:fly={{ duration: 300, x: -80 }}
							>
								<button type="button" class="btn rounded-container-token variant-soft-error"
									>Xoá</button
								>
								<button
									type="button"
									on:click={() => (editting = true)}
									class="btn rounded-container-token variant-filled-primary"
								>
									Chỉnh sửa
								</button>
							</div>
						{/if}
					</div>
				</form>
			</div>
			<div class="col-span-7">
				<p class="text-2xl font-semibold p-4">Lịch hẹn</p>
				<div
					class="bg-white rounded-container-token shadow-md p-4 flex flex-col transition-all overflow-hidden duration-300 {editting
						? 'h-[480px]'
						: 'h-60'}"
				>
					<div
						class="grid grid-cols-[auto_2fr_1fr] pb-2 border-b font-bold text-sm text-surface-500 tracking-wide"
					>
						<span class="w-16 text-center">#</span>
						<span class="text-center">Thời gian</span>
						<span class="text-center">Bác sĩ</span>
					</div>
					<div
						class="grid grid-cols-[auto_2fr_1fr] overflow-y-scroll flex-1 items-center content-start"
					>
						{#each Array(10) as _, i}
							<span class="py-2 w-16 text-center">{i + 1}</span>
							<span class="py-2 text-center text-sm font-medium">13:00PM - 16/06/2024</span>
							<span class="py-2 text-center">Bác sĩ A</span>
						{/each}
					</div>
				</div>
			</div>
		</div>
		<div class="mt-4">
			<p class="text-2xl font-semibold p-4">Bệnh án</p>
			<div class="p-4 bg-white rounded-container-token shadow-md border">
				<table class="w-full">
					<thead>
						<tr>
							<th class="h-10 table-cell-fit px-4"></th>
							<th class="text-start px-4">Bác sĩ</th>
							<th class="text-end px-4">Số điện thoại</th>
							<th class="text-start px-4">Lý do</th>
							<th class="px-4">Thời gian khám</th>
							<th class="px-4">Trạng thái</th>
							<th class="px-4">Tái khám</th>
						</tr>
					</thead>
					<tbody>
						{#each records as record (record.id)}
							<tr class="border-t">
								<td class="px-4 py-2">
									<Tooltip.Root openDelay={0}>
										<Tooltip.Trigger asChild let:builder>
											<a
												use:builder.action
												{...builder}
												href="/records/{record.id}"
												class="btn-icon variant-outline-surface rounded-xl hover:variant-ghost-tertiary"
											>
												<i class="fa-solid fa-circle-info"></i>
											</a>
										</Tooltip.Trigger>
										<Tooltip.Content
											transition={fly}
											transitionConfig={{
												duration: 200,
												y: 30,
												easing: cubicOut
											}}
											sideOffset={8}
											class="shadow-md font-semibold px-4 py-3 border rounded-md bg-white"
										>
											Chi tiết
											<Tooltip.Arrow class="border-l border-t" />
										</Tooltip.Content>
									</Tooltip.Root>
								</td>
								<td class="text-start px-4">{record.doctorName}</td>
								<td class="text-end px-4">{record.doctorPhone}</td>
								<td class="text-start px-4">{record.reason}</td>
								<td class="text-center px-4">{formatCompactDateTime(record.visitDate)}</td>
								<td class="text-center px-4">{recordStatusInfo[record.status]?.label}</td>
								<td class="text-center px-4">
									<input
										type="checkbox"
										disabled
										checked={record.isReVisit}
										class="checkbox bg-white"
									/>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
