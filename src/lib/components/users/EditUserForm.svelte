<script lang="ts">
	import { setError, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { z } from 'zod';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher, getContext, onMount, type ComponentEvents } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { ToggleGroup } from 'bits-ui';
	import { Role, roleTranslation, userRoles } from '$lib/helpers/authorization';
	import { editUserSchema } from '$lib/form-schemas/edit-user-schema';
	import { SlideToggle, getModalStore } from '@skeletonlabs/skeleton';
	import endpoints from '$lib/endpoints';
	import { getRoleId, handleToastFetch, pascalToCamelcase } from '$lib/helpers/utils';
	import { type Writable } from 'svelte/store';

	export let editUserForm: SuperValidated<z.infer<typeof editUserSchema>>;
	export let user: User;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const modalStore = getModalStore();
	const dispatch = createEventDispatcher<{ cancel: undefined; finish: undefined }>();
	const form = superForm(editUserForm, {
		validators: zodClient(editUserSchema),
		resetForm: false,
		SPA: true,
		onUpdate: ({ form }) => {
			if (!form.valid || !$userStore) {
				return;
			}

			toast.promise(
				handleToastFetch(
					() => {
						const { roles, status, ...others } = form.data;
						const rielForm: Record<string, string | boolean | number | number[]> = { ...others };

						if (user.roles.includes(Role.Admin && !roles.includes(Role.Admin))) {
							roles.push(Role.Admin);
						}

						rielForm.roleIds = roles.map(getRoleId).filter((x) => x !== 0);
						rielForm.status = status ? 1 : 2;

						return fetch(endpoints.users.edit(form.data.id), {
							method: 'PUT',
							headers: {
								'content-type': 'application/json',
								Authorization: `Bearer ${$userStore.token}`
							},
							body: JSON.stringify(rielForm)
						});
					},
					{ success: 'Cập nhật thông tin thành công' },
					() => {
						dispatch('finish');
						$modalStore[0]?.response?.(true);
						closeModal();
					},
					form
				),
				{
					loading: 'Đang xử lý...',
					success: (msg) => msg ?? 'Cập nhật thông tin thành công',
					error: (msg) =>
						String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình cập nhật thông tin nhân viên'
				}
			);
		}
	});
	const { form: formData, enhance } = form;
	let requesting = false;

	onMount(() => {
		$formData.id = user.id;
		$formData.phone = user.phone;
		// $formData.birthday = user.birthday;
		$formData.salary = user.salary;
		// @ts-ignore
		$formData.roles = [...user.roles];
		$formData.status = user.status === 1;
	});

	// function birthdayChanged(e: ComponentEvents<DatePicker>['valueChange']) {
	// 	if (e.detail) {
	// 		e.detail.setMinutes(e.detail.getMinutes() - e.detail.getTimezoneOffset());
	// 		$formData.birthday = e.detail;
	// 	}
	// }

	function closeModal() {
		modalStore.close();
	}
</script>

<div class="card bg-white p-6 w-full sm:w-5/6 md:w-3/4 lg:w-3/5 xl:w-1/2 2xl:w-[720px]">
	<div class="flex justify-between">
		<div class="text-2xl rounded-md border border-surface-200 size-14 text-center leading-[3.5rem]">
			<i class="fa-regular fa-user-pen"></i>
		</div>
		<button
			class="btn-icon text-2xl !outline-none text-black/60 hover:text-black transition-colors"
			on:click={closeModal}
		>
			<i class="fa-solid fa-xmark"></i>
		</button>
	</div>
	<h1 class="font-semibold text-2xl mt-6">
		Sửa thông tin nhân viên
		<span class="font-light text-surface-300">#{user.id}</span>
	</h1>
	<p class="font-semibold text-surface-400 mb-6">Cập nhật thông tin của nhân viên</p>
	<form use:enhance action="/users?/editUser" method="post">
		<Field {form} name="id">
			<Control let:attrs>
				<input
					{...attrs}
					type="hidden"
					class="input rounded-container-token mt-1"
					bind:value={$formData.id}
				/>
			</Control>
		</Field>
		<fieldset class="grid grid-cols-2 gap-4" disabled={requesting}>
			<div>
				<Field {form} name="phone">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">Số điện thoại</Label>
						<input
							{...attrs}
							type="text"
							maxlength={10}
							class="input rounded-container-token mt-1"
							bind:value={$formData.phone}
						/>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div>
				<Field {form} name="salary">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">Lương</Label>
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
			<div>
				<Field {form} name="status">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none mb-1">Trạng thái</Label>
						<SlideToggle
							{...attrs}
							size="sm"
							bind:checked={$formData.status}
							active="bg-primary-500"
						>
							{#if $formData.status}
								Hoạt động
							{:else}
								Không hoạt động
							{/if}
						</SlideToggle>
					</Control>
					<FieldErrors class="text-sm mt-1" />
				</Field>
			</div>
			<div class="col-span-2">
				<Field {form} name="roles">
					<p class="font-semibold text-surface-500 select-none">Vai trò</p>
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
			<button type="button" class="variant-ghost-surface" on:click={closeModal}>
				<i class="fa-solid fa-delete-left"></i>
				<span class="pl-1">Huỷ</span>
			</button>
			<button type="submit" class="variant-filled-primary">
				<i class="fa-solid fa-check"></i>
				<span class="pl-1">Cập nhật</span>
			</button>
		</fieldset>
	</form>
</div>
