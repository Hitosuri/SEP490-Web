<script lang="ts">
	import { dateProxy, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { z } from 'zod';
	import { Control, Field, FieldErrors, Label } from 'formsnap';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createEventDispatcher, onMount, type ComponentEvents } from 'svelte';
	import { toast } from 'svelte-sonner';
	import DatePicker from '$lib/components/common/DatePicker.svelte';
	import { CalendarDate } from '@internationalized/date';
	import { ToggleGroup } from 'bits-ui';
	import { roleTranslation, userRoles } from '$lib/authorization';
	import { editUserSchema } from '$lib/form-schemas/edit-user-schema';
	import { getModalStore } from '@skeletonlabs/skeleton';

	export let editUserForm: SuperValidated<z.infer<typeof editUserSchema>>;
	export let user: User;

	const modalStore = getModalStore();
	const dispatch = createEventDispatcher<{ cancel: undefined; finish: undefined }>();
	const form = superForm(editUserForm, {
		validators: zodClient(editUserSchema),
		invalidateAll: false,
		resetForm: false,
		onSubmit: () => {
			requesting = true;
			const promise = new Promise<string>((resolve, reject) => {
				submitingResolve = resolve;
				submitingReject = reject;
			});
			toast.promise(promise, {
				loading: 'Đang xử lý...',
				success: (msg) => msg || 'Cập nhật thông tin thành công',
				error: (msg) =>
					String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình cập nhật thông tin nhân viên'
			});
		},
		onResult: (event) => {
			requesting = false;
			console.log(event);

			if (event.result.type === 'success') {
				const msg = event.result?.data?.form?.message || 'Cập nhật thông tin thành công';
				submitingResolve?.(msg);
				dispatch('finish');
			}
			if (event.result.type === 'failure' && event.result?.data?.form?.message) {
				submitingReject?.(event.result?.data?.form?.message);
			}
		}
	});
	const { form: formData, enhance } = form;
	const birthDateProxy = dateProxy(formData, 'birthday', { format: 'date', empty: undefined });
	const today = new Date();
	let requesting = false;
	let submitingResolve: ((value: string | PromiseLike<string>) => void) | undefined;
	let submitingReject: ((reason?: any) => void) | undefined;

	onMount(() => {
		$formData.id = user.id;
		$formData.name = user.name;
		$formData.email = user.email;
		$formData.phone = user.phone;
		$formData.birthday = user.birthday;
		$formData.salary = user.salary;
		// @ts-ignore
		$formData.roles = [...user.roles];
	});

	function birthdayChanged(e: ComponentEvents<DatePicker>['valueChange']) {
		if (e.detail) {
			e.detail.setMinutes(e.detail.getMinutes() - e.detail.getTimezoneOffset());
			$formData.birthday = e.detail;
		}
	}

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
				<Field {form} name="name">
					<Control let:attrs>
						<Label class="font-semibold text-surface-500 select-none">Họ và tên</Label>
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
						<Label class="font-semibold text-surface-500 select-none">Email</Label>
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
						<Label class="font-semibold text-surface-500 select-none">Số điện thoại</Label>
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
						<Label class="font-semibold text-surface-500 select-none">Ngày sinh</Label>
						<input
							{...attrs}
							type="hidden"
							class="input rounded-container-token mt-1"
							bind:value={$birthDateProxy}
						/>
						<DatePicker
							regionInput="mt-1 w-full"
							regionContent="z-[999]"
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
			<div class="col-span-2">
				<Field {form} name="roles">
					<p class="font-semibold text-surface-500 select-none">Vai trò</p>
					<ToggleGroup.Root
						bind:value={$formData.roles}
						class="flex rounded-lg border overflow-hidden w-fit mt-1"
					>
						{#each userRoles as userRole, i}
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
