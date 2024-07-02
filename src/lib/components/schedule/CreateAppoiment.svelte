<script lang="ts">
	import { createAppointmentSchema } from '$lib/form-schemas/create-appointment-schema';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { createEventDispatcher, getContext, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import endpoints from '$lib/endpoints';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { Combobox, type Selected } from 'bits-ui';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { formatFullDate } from '$lib/helpers/formatters';
	import { type Writable } from 'svelte/store';

	export let createAppointmentForm: SuperValidated<z.infer<typeof createAppointmentSchema>>;
	export let startHour: number;
	export let startMinute: number;
	export let endHour: number;
	export let endMinute: number;
	export let date: Date;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const modalStore = getModalStore();
	const dispatch = createEventDispatcher<{ cancel: undefined; finish: undefined }>();
	const form = superForm(createAppointmentForm, {
		validators: zodClient(createAppointmentSchema),
		resetForm: false,
		SPA: true,
		onUpdate: ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}
			console.log(form);

			// toast.promise(
			// 	async (): Promise<string> => {
			// 		const { roles, ...others } = form.data;
			// 		const rielForm: Record<string, string | number[] | number | Date> = { ...others };
			// 		rielForm.roleIds = roles.map(getRoleId).filter((x) => x !== 0);

			// 		const response = await fetch(endpoints.users.create, {
			// 			method: 'POST',
			// 			headers: {
			// 				'content-type': 'application/json',
			// 				Authorization: `Bearer ${$userStore.token}`
			// 			},
			// 			body: JSON.stringify(rielForm)
			// 		});
			// 		const data = await response.json();

			// 		if (!response.ok) {
			// 			if (Array.isArray(data?.error) || Array.isArray(data)) {
			// 				const msg = (data?.error ?? data).join(', ');
			// 				return Promise.reject(msg);
			// 			} else if (typeof data === 'object') {
			// 				Object.keys(data).forEach((k) => {
			// 					const fieldName = pascalToCamelcase(k);
			// 					if (Object.keys(form.data).includes(fieldName)) {
			// 						setError(form, fieldName, data[k]);
			// 					}
			// 				});
			// 				return Promise.reject();
			// 			}

			// 			return Promise.reject();
			// 		}
			// 		dispatch('finish');
			// 		return 'Tạo nhân viên thành công';
			// 	},
			// 	{
			// 		loading: 'Đang xử lý...',
			// 		success: (msg) => msg ?? 'Tạo nhân viên thành công',
			// 		error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình tạo nhân viên'
			// 	}
			// );
		}
	});
	const { form: formData, enhance } = form;
	let requesting = false;
	let patients: Selected<Patient>[] = [];
	let patientSearchInput = '';
	let lastPatientSearchInput: string;
	let patientSearchOpen = false;
	let patientFirstOpen = false;
	let patientSearchTimer: NodeJS.Timeout;
	let selectedPatient: Selected<Patient> | undefined;
	let doctors: Selected<User>[] = [];
	let doctorSearchInput = '';
	let lastdoctorSearchInput: string;
	let doctorSearchOpen = false;
	let doctorFirstOpen = false;
	let doctorSearchTimer: NodeJS.Timeout;
	let selectedDoctor: Selected<User> | undefined;

	$: onPatientSearchOpen(patientSearchOpen);
	$: patientSearch(patientSearchInput);
	$: $formData.patientId = selectedPatient?.value.id ?? 0;
	$: onDoctorSearchOpen(doctorSearchOpen);
	$: doctorSearch(doctorSearchInput);
	$: $formData.doctorId = selectedDoctor?.value.id ?? 0;

	onMount(() => {
		const startTime = new Date(date);
		startTime.setHours(startHour);
		startTime.setMinutes(startMinute);
		const endTime = new Date(date);
		endTime.setHours(endHour);
		endTime.setMinutes(endMinute);

		$formData.startAt = startTime;
		$formData.endAt = endTime;
	});

	function closeModal() {
		$modalStore[0]?.response?.(true);
		modalStore.close();
	}

	function onPatientSearchOpen(open: boolean) {
		if (!open) {
			return;
		}
		if (patientFirstOpen) {
			return;
		}

		patientFirstOpen = true;
		patientSearch('');
	}

	function onDoctorSearchOpen(open: boolean) {
		if (!open) {
			return;
		}
		if (doctorFirstOpen) {
			return;
		}

		doctorFirstOpen = true;
		doctorSearch('');
	}

	function patientSearch(input: string) {
		if (!patientFirstOpen) {
			return;
		}
		const keyword = input.trim();

		if (patientSearchTimer) {
			clearTimeout(patientSearchTimer);
		}

		patientSearchTimer = setTimeout(async () => {
			if (keyword === lastPatientSearchInput || !$userStore) {
				return;
			}

			const searchParams = new URLSearchParams();
			searchParams.set('page', '1');
			searchParams.set('size', '5');
			searchParams.set('name', keyword);

			const url = `${endpoints.patients.get}?${searchParams}`;
			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${$userStore.token}`
				}
			});

			if (!response.ok) {
				return;
			}

			const data: Pagination<Patient[]> = await response.json();

			lastPatientSearchInput = keyword;
			patients = data.data.map((x) => ({
				label: x.name ?? '',
				value: x
			}));
		}, 400);
	}

	function doctorSearch(input: string) {
		if (!doctorFirstOpen) {
			return;
		}
		const keyword = input.trim();

		if (doctorSearchTimer) {
			clearTimeout(doctorSearchTimer);
		}

		doctorSearchTimer = setTimeout(async () => {
			if (keyword === lastdoctorSearchInput || !$userStore) {
				return;
			}

			const searchParams = new URLSearchParams();
			searchParams.set('page', '1');
			searchParams.set('size', '5');
			searchParams.set('name', keyword);
			searchParams.set('roles', 'doctor');

			const url = `${endpoints.users.get}?${searchParams}`;
			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${$userStore.token}`
				}
			});

			if (!response.ok) {
				return;
			}

			const data: Pagination<User[]> = await response.json();

			lastdoctorSearchInput = keyword;
			doctors = data.data.map((x) => ({
				label: x.name ?? '',
				value: x
			}));
		}, 400);
	}
</script>

<div class="card bg-white p-6 w-full sm:w-5/6 md:w-3/4 lg:w-3/5 xl:w-1/2 2xl:w-[720px]">
	<div class="flex justify-between">
		<div class="text-2xl rounded-md border border-surface-200 size-14 text-center leading-[3.5rem]">
			<i class="fa-regular fa-calendar-lines-pen"></i>
		</div>
		<button
			class="btn-icon text-2xl !outline-none text-black/60 hover:text-black transition-colors"
			on:click={closeModal}
		>
			<i class="fa-solid fa-xmark"></i>
		</button>
	</div>
	<h1 class="font-semibold text-2xl mt-6">Tạo lịch hẹn</h1>
	<p class="font-semibold text-surface-400 mb-6">Tạo lịch hẹn khám cho bệnh nhân</p>
	<form use:enhance method="post">
		<fieldset disabled={requesting} class="grid grid-cols-2 gap-4">
			<div>
				<p class="font-semibold text-surface-500 select-none mb-1">Thời gian hẹn</p>
				<p class="text-xl font-medium tracking-wide">
					{startHour}:{String(startMinute).padStart(2, '0')}
					-
					{endHour}:{String(endMinute).padStart(2, '0')}
				</p>
			</div>
			<div>
				<p class="font-semibold text-surface-500 select-none mb-1">Ngày hẹn</p>
				<p class="text-xl font-medium tracking-wide">{formatFullDate(date)}</p>
			</div>
			<div>
				<Field {form} name="patientId">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none mb-1">
							Bệnh nhân<sup class="text-red-500">*</sup>
						</Label>
						<Combobox.Root
							items={patients}
							bind:inputValue={patientSearchInput}
							bind:open={patientSearchOpen}
							bind:selected={selectedPatient}
						>
							<div class="relative">
								<Combobox.Input
									class="input rounded-md bg-white w-full"
									placeholder="Tên bệnh nhân..."
									aria-label="Tên bệnh nhân..."
								/>
							</div>

							<Combobox.Content
								class="w-full rounded-md border border-surface-100 bg-white p-1 shadow-lg z-[999]"
								transition={fly}
								transitionConfig={{
									duration: 200,
									y: 30,
									easing: cubicOut
								}}
								sideOffset={8}
							>
								{#each patients as patient (patient.value.id)}
									<Combobox.Item
										class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-2 rounded select-none flex gap-3 items-center cursor-pointer"
										value={patient.value}
										label={patient.label}
									>
										<div>
											<p class={!patient.label ? 'text-warning-500' : ''}>
												{patient.label || 'Chưa có tên'}
											</p>
											<p class="text-xs font-medium text-surface-400">
												{patient.value.phone ?? patient.value.email ?? ''}
											</p>
										</div>
										<Combobox.ItemIndicator class="ml-auto" asChild={false}>
											<i class="fa-solid fa-check text-primary-500"></i>
										</Combobox.ItemIndicator>
									</Combobox.Item>
								{:else}
									<span class="block px-5 py-2 text-sm text-muted-foreground">
										Không có kết quả
									</span>
								{/each}
							</Combobox.Content>
							<Combobox.HiddenInput name="favoriteFruit" />
						</Combobox.Root>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div>
				<Field {form} name="doctorId">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none mb-1">
							Bác sĩ
							<sup class="text-red-500">*</sup>
						</Label>
						<Combobox.Root
							items={doctors}
							bind:inputValue={doctorSearchInput}
							bind:open={doctorSearchOpen}
							bind:selected={selectedDoctor}
						>
							<div class="relative">
								<Combobox.Input
									class="input rounded-md bg-white w-full"
									placeholder="Tên bác sĩ..."
									aria-label="Tên bác sĩ..."
								/>
							</div>

							<Combobox.Content
								class="w-full rounded-md border border-surface-100 bg-white p-1 shadow-lg z-[999]"
								transition={fly}
								transitionConfig={{
									duration: 200,
									y: 30,
									easing: cubicOut
								}}
								sideOffset={8}
							>
								{#each doctors as doctor (doctor.value.id)}
									<Combobox.Item
										class="data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-500 px-4 py-2 rounded select-none flex gap-3 items-center cursor-pointer"
										value={doctor.value}
										label={doctor.label}
									>
										<div>
											<p>{doctor.label}</p>
											<p class="text-xs font-medium text-surface-400">{doctor.value.email}</p>
										</div>
										<Combobox.ItemIndicator class="ml-auto" asChild={false}>
											<i class="fa-solid fa-check text-primary-500"></i>
										</Combobox.ItemIndicator>
									</Combobox.Item>
								{:else}
									<span class="block px-5 py-2 text-sm text-muted-foreground">
										Không có kết quả
									</span>
								{/each}
							</Combobox.Content>
							<Combobox.HiddenInput name="favoriteFruit" />
						</Combobox.Root>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div class="col-span-2">
				<Field {form} name="description">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none mb-1">Mô tả</Label>
						<textarea
							class="textarea rounded-md bg-white"
							{...attrs}
							rows="4"
							placeholder="Nhập mô tả..."
							bind:value={$formData.description}
						></textarea>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
		</fieldset>
		<fieldset
			disabled={requesting}
			class="flex gap-4 mt-8 font-medium *:btn *:rounded-container-token *:flex-1"
		>
			<button type="button" class="variant-soft-surface" on:click={closeModal}>
				<i class="fa-solid fa-delete-left"></i>
				<span class="pl-1">Huỷ</span>
			</button>
			<button type="submit" class="variant-filled-primary">
				<i class="fa-solid fa-plus"></i>
				<span class="pl-1">Tạo</span>
			</button>
		</fieldset>
	</form>
</div>
