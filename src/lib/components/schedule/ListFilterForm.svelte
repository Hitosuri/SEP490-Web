<script lang="ts">
	import { scheduleFilterSchema } from '$lib/form-schemas/schedule-filter-schema';
	import { Checkbox, type Selected } from 'bits-ui';
	import { Control, Field, Label } from 'formsnap';
	import type { SuperForm } from 'sveltekit-superforms';
	import { z } from 'zod';
	import DropdownSelect from '../common/DropdownSelect.svelte';
	import { createEventDispatcher } from 'svelte';
	import { scheduleStatusInfo } from '$lib/constants/schedule-constant';

	export let form: SuperForm<z.infer<typeof scheduleFilterSchema>>;

	const { form: formData, enhance } = form;
	const dispatch = createEventDispatcher<{
		reset: undefined;
	}>();
	const statusList: Selected<z.infer<typeof scheduleFilterSchema>['status'] | undefined>[] = [
		{
			value: undefined,
			label: 'Tất cả'
		},
		{
			value: '1',
			label: scheduleStatusInfo[1].label
		},
		{
			value: '2',
			label: scheduleStatusInfo[2].label
		},
		{
			value: '3',
			label: scheduleStatusInfo[3].label
		}
	];
	let selectedStatus: Selected<z.infer<typeof scheduleFilterSchema>['status'] | undefined> =
		statusList[0];
	let isPatientConfirm: boolean | 'indeterminate' = 'indeterminate';

	$: $formData.status = selectedStatus?.value;
	$: $formData.isPatientConfirm =
		isPatientConfirm === 'indeterminate' ? undefined : isPatientConfirm;
</script>

<form use:enhance method="post" class="flex gap-4 items-end">
	<div class="h-full w-2 bg-gradient-to-t from-teal-400 to-sky-400 rounded-full"></div>
	<div>
		<Field {form} name="patientPhone">
			<Control let:attrs>
				<Label class="text-sm font-semibold text-surface-500 select-none"
					>Tìm theo sđt bệnh nhân</Label
				>
				<input
					{...attrs}
					type="text"
					class="input rounded-container-token mt-1"
					placeholder="Số điện thoại bệnh nhân..."
					bind:value={$formData.patientPhone}
				/>
			</Control>
		</Field>
	</div>
	<div>
		<Field {form} name="doctorName">
			<Control let:attrs>
				<Label class="text-sm font-semibold text-surface-500 select-none">Tìm theo tên bác sĩ</Label
				>
				<input
					{...attrs}
					type="text"
					class="input rounded-container-token mt-1"
					placeholder="Tên bác sĩ..."
					bind:value={$formData.doctorName}
				/>
			</Control>
		</Field>
	</div>
	<div>
		<Field {form} name="status">
			<Control let:attrs>
				<Label class="text-sm font-semibold text-surface-500 select-none">Trạng thái</Label>
				<DropdownSelect
					items={statusList}
					let:ValueComponent
					bind:selected={selectedStatus}
					regionInput="mt-1 py-2 border border-surface-300 min-w-36 justify-between"
				>
					<ValueComponent class="font-medium px-2" />
					<div class="flex flex-col text-[0.55rem] pl-1 text-surface-400">
						<i class="fa-solid fa-chevron-up"></i>
						<i class="fa-solid fa-chevron-down"></i>
					</div>
				</DropdownSelect>
			</Control>
		</Field>
	</div>
	<div>
		<Field {form} name="isPatientConfirm">
			<Control let:attrs>
				<Label class="text-sm font-semibold text-surface-500 select-none">Đã xác nhận</Label>
				<div class="mt-1 h-[42px] flex items-center ml-4">
					<Checkbox.Root
						class="checkbox {isPatientConfirm
							? 'bg-primary-500 border-none'
							: 'bg-white'} -translate-x-[2px] block"
						bind:checked={isPatientConfirm}
					>
						<Checkbox.Indicator
							let:isChecked
							let:isIndeterminate
							class="*:block text-white text-sm"
						>
							{#if isChecked}
								<i class="fa-solid fa-check"></i>
							{:else if isIndeterminate}
								<i class="fa-solid fa-minus"></i>
							{/if}
						</Checkbox.Indicator>
					</Checkbox.Root>
				</div>
			</Control>
		</Field>
	</div>
	<button type="submit" class="btn variant-filled-primary ml-auto mt-4 block py-2 h-[42px]">
		<i class="fa-solid fa-magnifying-glass"></i>
		<span>Tìm kiếm</span>
	</button>
	<button
		type="button"
		class="btn variant-filled-tertiary mt-4 block p-0 size-[42px]"
		on:click={() => {
			form.reset();
			selectedStatus = statusList[0];
			isPatientConfirm = 'indeterminate';
			dispatch('reset');
		}}
	>
		<i class="fa-regular fa-arrow-rotate-left"></i>
	</button>
</form>
<!-- <SuperDebug data={$formData} /> -->
