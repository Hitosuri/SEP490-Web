<script lang="ts">
	import { Accordion } from 'bits-ui';
	import { slide } from 'svelte/transition';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { z } from 'zod';
	import Loading from '$lib/components/common/Loading.svelte';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import isEqual from 'lodash-es/isEqual';
	import endpoints from '$lib/endpoints';
	import { createExportMaterialSchema } from '$lib/form-schemas/create-export-material-schema';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import CreateExportMaterialForm from '$lib/components/materials/exports/CreateExportMaterialForm.svelte';
	import { formatCompactDateTime, formatCurrency } from '$lib/helpers/formatters';
	import EditExportMaterialForm from './EditExportMaterialForm.svelte';
	import { editExportMaterialSchema } from '$lib/form-schemas/edit-export-material-schema';
	import { toast } from 'svelte-sonner';
	import CustomPagination from '$lib/components/common/CustomPagination.svelte';
	import AssignExportMaterialForm from './AssignExportMaterialForm.svelte';
	import { Role } from '$lib/helpers/authorization';

	export function onTabActive() {
		if (exportGroupsPromise) {
			return;
		}

		filtering(requesterName, supplierName, currentPage, pageSize, true, true, true);
	}
	export let createExportMaterialForm: SuperValidated<z.infer<typeof createExportMaterialSchema>>;
	export let editExportMaterialForm: SuperValidated<z.infer<typeof editExportMaterialSchema>>;

	const modalStore = getModalStore();
	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	let exportGroupsPromise: Promise<ExportGroup[]> | undefined;
	let filterTimer: NodeJS.Timeout | undefined;
	let currentPage = 1;
	let totalItems = 0;
	let pageSize = 20;
	let requesterName = '';
	let supplierName = '';
	let isProcessing = true;
	let lastestFilterOption: Record<string, string | boolean> = {
		page: String(currentPage),
		size: String(pageSize),
		requesterName,
		supplierName,
		isProcessing
	};
	let openedItems: string[] = [];

	$: filtering(requesterName, supplierName, currentPage, pageSize);

	function filtering(
		requesterName: string,
		supplierName: string,
		page: number,
		size: number,
		ignoreDelay: boolean = false,
		forceFilter: boolean = false,
		resetCurrentPage: boolean = false
	) {
		requesterName = requesterName.trim();
		supplierName = supplierName.trim();

		const filterOption: Record<string, string | boolean> = {
			page: String(page),
			size: String(size),
			requesterName,
			supplierName,
			isProcessing
		};

		if (!forceFilter && isEqual(lastestFilterOption, filterOption)) {
			return;
		}

		if (filterTimer) {
			clearTimeout(filterTimer);
			filterTimer = undefined;
		}

		filterTimer = setTimeout(
			() => {
				if (!$userStore) {
					return;
				}

				const searchParams = new URLSearchParams();
				for (const [key, value] of Object.entries(filterOption)) {
					searchParams.set(key, String(value));
				}
				const url = `${endpoints.materials.export.get}?${searchParams}`;

				exportGroupsPromise = fetch(url, {
					headers: {
						Authorization: `Bearer ${$userStore.token}`
					}
				})
					.then<Pagination<ExportGroup[]>>((r) => {
						if (r.ok) {
							return r.json();
						}

						throw 'Đã có lỗi xảy ra';
					})
					.then((pageData) => {
						pageData.data.forEach((x) => {
							x.createAt = new Date(x.createAt);
						});
						totalItems = pageData.totalRecords;
						lastestFilterOption = filterOption;

						if (resetCurrentPage) {
							currentPage = 1;
						}
						return pageData.data;
					});
			},
			ignoreDelay ? 0 : 400
		);
	}

	function showCreateForm() {
		const modalSetting: ModalSettings = {
			type: 'component',
			component: {
				ref: CreateExportMaterialForm,
				props: {
					createExportMaterialForm
				}
			},
			response: (r) => {
				if (r) {
					filtering(requesterName, supplierName, currentPage, pageSize, true, true);
				}
			}
		};
		modalStore.trigger(modalSetting);
	}

	function showAssignForm(exportGroup: ExportGroup) {
		const modalSetting: ModalSettings = {
			type: 'component',
			component: {
				ref: AssignExportMaterialForm,
				props: {
					exportGroup,
					editExportMaterialForm
				}
			},
			response: (r) => {
				if (r) {
					filtering(requesterName, supplierName, currentPage, pageSize, true, true);
				}
			}
		};

		modalStore.trigger(modalSetting);
	}

	function showEditForm(exportGroup: ExportGroup) {
		const modalSetting: ModalSettings = {
			type: 'component',
			component: {
				ref: EditExportMaterialForm,
				props: {
					group: exportGroup.group,
					editExportMaterialForm
				}
			},
			response: (r) => {
				if (r) {
					filtering(requesterName, supplierName, currentPage, pageSize, true, true);
				}
			}
		};

		modalStore.trigger(modalSetting);
	}

	function changeIsProcessing(value: boolean) {
		if (value === isProcessing) {
			return;
		}

		isProcessing = value;
		filtering(requesterName, supplierName, currentPage, pageSize, true);
	}

	function deleteGroup(exportGroup: ExportGroup) {
		const modalSetting: ModalSettings = {
			type: 'confirm',
			title: 'Xác nhận',
			body: `Xác nhận xoá phiếu xuất vật tư được tạo lúc ${formatCompactDateTime(exportGroup.createAt)}`,
			response: (r) => {
				if (!r || !$userStore) {
					return;
				}

				toast.promise(
					async (): Promise<string> => {
						const response = await fetch(
							endpoints.materials.export.deleteGroup(exportGroup.group),
							{
								method: 'DELETE',
								headers: {
									'content-type': 'application/json',
									Authorization: `Bearer ${$userStore.token}`
								}
							}
						);

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
						filtering(requesterName, supplierName, currentPage, pageSize, true, true);
						return 'Phiếu xuất vật tư được xoá thành công';
					},
					{
						loading: 'Đang xử lý...',
						success: (msg) => msg ?? 'Phiếu xuất vật tư được xoá thành công',
						error: (msg) =>
							String(msg ?? '') || 'Đã xảy ra lỗi trong quá trình xoá phiếu xuất vật tư'
					}
				);
			}
		};
		modalStore.trigger(modalSetting);
	}
</script>

<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Lịch sử xuất vật tư</h1>
<div class="p-1 bg-slate-300 shadow-inner flex gap-1 rounded-lg overflow-hidden items-center">
	<div class="input border-surface-500/25 w-fit overflow-hidden rounded-container-token flex">
		<div class="size-10 flex justify-center items-center border-r border-inherit">
			<i class="fa-solid fa-magnifying-glass"></i>
		</div>
		<input
			type="text"
			placeholder="Nhập tên người tạo..."
			class="border-none !focus:outline-0 rounded-none"
			bind:value={requesterName}
		/>
	</div>
	<div class="input border-surface-500/25 w-fit overflow-hidden rounded-container-token flex">
		<div class="size-10 flex justify-center items-center border-r border-inherit">
			<i class="fa-solid fa-magnifying-glass"></i>
		</div>
		<input
			type="text"
			placeholder="Nhập tên nhà cung cấp..."
			class="border-none !focus:outline-0 rounded-none"
			bind:value={supplierName}
		/>
	</div>
	<div class="bg-white p-1 rounded-full text-sm h-fit flex gap-x-1">
		<button
			type="button"
			class="rounded-full {isProcessing
				? 'bg-primary-500 text-white'
				: ''} font-semibold px-2 py-1 h-fit"
			on:click={() => changeIsProcessing(true)}
		>
			Đang xử lý
		</button>
		<button
			type="button"
			class="rounded-full {!isProcessing
				? 'bg-primary-500 text-white'
				: ''} font-semibold px-2 py-1 h-fit"
			on:click={() => changeIsProcessing(false)}
		>
			Hoàn thành
		</button>
	</div>
	<button
		type="button"
		class="btn-icon variant-filled-tertiary"
		on:click={() => {
			requesterName = '';
			supplierName = '';
			isProcessing = true;
			filtering(requesterName, supplierName, 1, pageSize, true, false, true);
		}}
	>
		<i class="fa-solid fa-rotate-left"></i>
	</button>
	{#if $userStore?.roles.includes(Role.Accountant)}
		<button
			type="button"
			class="btn variant-filled-primary rounded-md font-medium ml-auto"
			on:click={showCreateForm}
		>
			<i class="fa-solid fa-plus"></i>
			<span class="pl-1">Thêm</span>
		</button>
	{/if}
</div>
{#if exportGroupsPromise}
	{#await exportGroupsPromise}
		<Loading class="mx-auto py-10" />
	{:then exportGroups}
		<Accordion.Root class="w-full py-4 space-y-4" bind:value={openedItems} multiple>
			{#each exportGroups as exportGroup, i (exportGroup.group)}
				<Accordion.Item
					value={exportGroup.group}
					class="group border border-l-4 rounded-lg border-surface-200"
				>
					<Accordion.Header>
						<Accordion.Trigger class="flex w-full gap-2 items-center px-6 h-16 group">
							<span class="text-lg w-44 text-start font-medium">
								{formatCompactDateTime(exportGroup.createAt)}
							</span>
							<span class="px-4 mr-auto">
								Tạo bởi:
								<span class="font-semibold">{exportGroup.createBy}</span>
							</span>
							{#if $userStore?.roles.includes(Role.Accountant) && exportGroup.exportMaterials.every((x) => x.quantity === x.avaliableMaterials.length)}
								<button
									on:click|stopPropagation={() => showEditForm(exportGroup)}
									type="button"
									class="btn btn-sm rounded-md variant-filled-tertiary h-8"
								>
									<i class="fa-regular fa-pen-to-square"></i>
									<span class="ml-1 font-medium">Sửa</span>
								</button>
							{/if}
							{#if $userStore?.roles.includes(Role.Accountant) && exportGroup.exportMaterials.some((x) => x.quantity !== x.avaliableMaterials.length)}
								<button
									on:click|stopPropagation={() => showAssignForm(exportGroup)}
									type="button"
									class="btn btn-sm rounded-md variant-filled-primary"
								>
									<i class="fa-regular fa-capsules"></i>
									<span class="ml-1 font-medium">Gán vật tư</span>
								</button>
								<button
									on:click|stopPropagation={() => deleteGroup(exportGroup)}
									type="button"
									class="btn btn-sm rounded-md variant-filled-error h-8"
								>
									<i class="fa-regular fa-trash-can"></i>
								</button>
							{/if}
							<div
								class="flex justify-center items-center size-8 pointer-events-none group-data-[state=open]:rotate-180 transition-all duration-200 ml-4"
							>
								<i class="fa-solid fa-chevron-down"></i>
							</div>
						</Accordion.Trigger>
					</Accordion.Header>
					<Accordion.Content
						transition={slide}
						transitionConfig={{ duration: 200 }}
						class="pl-12 pb-8 pt-2 pr-2 border-t"
					>
						<table class="w-full">
							<thead>
								<tr class="*:bg-slate-100">
									<th class="px-4 py-2 text-center rounded-tl-lg rounded-bl-lg">#</th>
									<th class="px-4 py-2 text-start whitespace-nowrap">Vật tư</th>
									<th class="px-4 py-2 text-end whitespace-nowrap">Số lượng</th>
									<th class="px-4 py-2 text-end whitespace-nowrap">Giá</th>
									<th class="px-4 py-2 text-start whitespace-nowrap">Ghi chú</th>
									<th class="px-4 py-2 text-center whitespace-nowrap rounded-tr-lg rounded-br-lg"
										>Đã hoàn thành</th
									>
								</tr>
							</thead>
							<tbody>
								{#each exportGroup.exportMaterials as material, i (material.id)}
									<tr>
										<td class="px-4 py-2 text-center w-0">{i + 1}</td>
										<td class="px-4 py-2 text-start">{material.name}</td>
										<td class="px-4 py-2 text-end cell-ellipsis">{material.quantity}</td>
										<td class="px-4 py-2 text-end cell-ellipsis max-w-[16%]">
											{formatCurrency(material.price)}
										</td>
										<td class="px-4 py-2 text-start">{material.note ?? ''}</td>
										<td class="px-4 py-2 text-center w-0">
											<input
												type="checkbox"
												disabled
												checked={material.avaliableMaterials.length === material.quantity}
												class="checkbox bg-white pointer-events-none"
											/>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
		<CustomPagination
			{totalItems}
			{pageSize}
			bind:currentPage
			on:pageChange={(e) => {
				currentPage = e.detail;
				filtering(requesterName, supplierName, e.detail, pageSize, true);
			}}
		/>
	{/await}
{/if}
