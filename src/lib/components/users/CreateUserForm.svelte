<script lang="ts">
	import { dateProxy, setError, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { z } from 'zod';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher, getContext, type ComponentEvents } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { createUserSchema } from '$lib/form-schemas/create-user-schema';
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { CalendarDate } from '@internationalized/date';
	import { ToggleGroup } from 'bits-ui';
	import { Role, roleTranslation, userRoles } from '$lib/helpers/authorization';
	import endpoints from '$lib/endpoints';
	import { getRoleId, handleToastFetch, pascalToCamelcase } from '$lib/helpers/utils';
	import { type Writable } from 'svelte/store';

	export let createUserForm: SuperValidated<z.infer<typeof createUserSchema>>;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const dispatch = createEventDispatcher<{ cancel: undefined; finish: undefined }>();
	const form = superForm(createUserForm, {
		validators: zodClient(createUserSchema),
		resetForm: false,
		SPA: true,
		onUpdate: ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}

			toast.promise(
				handleToastFetch(
					() => {
						const { roles, ...others } = form.data;
						const rielForm: Record<string, string | number[] | number | Date> = { ...others };
						rielForm.roleIds = roles.map(getRoleId).filter((x) => x !== 0);

						return fetch(endpoints.users.create, {
							method: 'POST',
							headers: {
								'content-type': 'application/json',
								Authorization: `Bearer ${$userStore.token}`
							},
							body: JSON.stringify(rielForm)
						});
					},
					{ success: 'Tạo nhân viên thành công' },
					() => {
						dispatch('finish');
					},
					form
				),
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Tạo nhân viên thành công',
					error: (msg) => String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình tạo nhân viên'
				}
			);
		}
	});
	const { form: formData, enhance } = form;
	const birthDateProxy = dateProxy(formData, 'birthday', { format: 'date', empty: undefined });
	const today = new Date();
	let requesting = false;

	function birthdayChanged(e: ComponentEvents<DatePicker>['valueChange']) {
		if (e.detail) {
			e.detail.setMinutes(e.detail.getMinutes() - e.detail.getTimezoneOffset());
			$formData.birthday = e.detail;
		}
	}
</script>

<div class="card bg-white p-6">
	<div class="flex justify-between">
		<div class="text-2xl rounded-md border border-surface-200 size-14 text-center leading-[3.5rem]">
			<i class="fa-regular fa-user-plus"></i>
		</div>
		<slot name="closeBtn" />
	</div>
	<h1 class="font-semibold text-2xl mt-6">Thêm nhân viên mới</h1>
	<p class="font-semibold text-surface-400 mb-6">Nhập các thông tin của nhân viên mới</p>
	<form use:enhance action="/users?/createUser" method="post">
		<fieldset class="grid grid-cols-2 gap-4" disabled={requesting}>
			<div>
				<Field {form} name="name">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">
							Họ và tên<sup class="text-red-500">*</sup>
						</Label>
						<input
							{...attrs}
							type="text"
							class="input rounded-container-token mt-1"
							bind:value={$formData.name}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div>
				<Field {form} name="email">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">
							Email<sup class="text-red-500">*</sup>
						</Label>
						<input
							{...attrs}
							type="email"
							class="input rounded-container-token mt-1"
							bind:value={$formData.email}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div>
				<Field {form} name="phone">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">
							Số điện thoại<sup class="text-red-500">*</sup>
						</Label>
						<input
							{...attrs}
							type="text"
							class="input rounded-container-token mt-1"
							bind:value={$formData.phone}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div>
				<Field {form} name="birthday">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">
							Ngày sinh<sup class="text-red-500">*</sup>
						</Label>
						<input
							{...attrs}
							type="hidden"
							class="input rounded-container-token mt-1"
							bind:value={$birthDateProxy}
						/>
						<DatePicker
							regionInput="mt-1 w-full"
							preventDeselect={true}
							on:valueChange={birthdayChanged}
							maxValue={new CalendarDate(
								today.getFullYear(),
								today.getMonth() + 1,
								today.getDate()
							)}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div>
				<Field {form} name="salary">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">
							Lương<sup class="text-red-500">*</sup>
						</Label>
						<input
							{...attrs}
							type="number"
							class="input rounded-container-token mt-1"
							bind:value={$formData.salary}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div class="col-span-2">
				<Field {form} name="roles">
					<p class="font-semibold text-surface-500 select-none">
						Vai trò<sup class="text-red-500">*</sup>
					</p>
					<ToggleGroup.Root
						bind:value={$formData.roles}
						class="flex rounded-lg border overflow-hidden w-fit mt-1"
					>
						{#each userRoles as userRole, i}
							{#if userRole !== Role.Admin}
								<Control let:attrs>
									{#if i !== 0}
										<div class="h-auto border-r"></div>
									{/if}
									<input
										class="hidden"
										type="checkbox"
										{...attrs}
										bind:group={$formData.roles}
										value={userRole}
									/>
									<ToggleGroup.Item
										class="btn py-2 rounded-none font-medium data-[state=on]:variant-filled-tertiary"
										value={userRole}>{roleTranslation[userRole]}</ToggleGroup.Item
									>
								</Control>
							{/if}
						{/each}
					</ToggleGroup.Root>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
		</fieldset>
		<fieldset
			disabled={requesting}
			class="flex gap-4 mt-8 font-medium *:btn *:rounded-container-token *:flex-1"
		>
			<slot name="cancelBtn">
				<button type="button" class="variant-ghost-surface">
					<i class="fa-solid fa-delete-left"></i>
					<span class="pl-1">Huỷ</span>
				</button>
			</slot>
			<button type="submit" class="variant-filled-primary">
				<i class="fa-solid fa-plus"></i>
				<span class="pl-1">Thêm</span>
			</button>
		</fieldset>
	</form>
</div>
