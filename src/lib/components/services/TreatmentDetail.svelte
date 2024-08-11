<script lang="ts">
	import { formatCurrency } from '$lib/helpers/formatters';
	import { getModalStore } from '@skeletonlabs/skeleton';

	export let treatment: Treatment;

	const modalStore = getModalStore();

	function closeModal() {
		modalStore.close();
	}
</script>

<div class="card bg-white p-6 w-full sm:w-5/6 md:w-3/4 lg:w-3/5 xl:w-1/2 2xl:w-[720px]">
	<div class="flex justify-between">
		<div class="text-2xl rounded-md border border-surface-200 size-14 text-center leading-[3.5rem]">
			<i class="fa-regular fa-teeth"></i>
		</div>
		<button
			class="btn-icon text-2xl !outline-none text-black/60 hover:text-black transition-colors"
			on:click={() => closeModal()}
		>
			<i class="fa-solid fa-xmark"></i>
		</button>
	</div>
	<h1 class="font-semibold text-2xl my-6">Thông tin dịch vụ</h1>
	<div class="space-y-2">
		<div class="flex gap-x-4">
			<p class="font-medium text-surface-500">Tên dịch vụ:</p>
			<hr class="self-center flex-1 !border-surface-200" />
			<p class="text-end font-semibold tracking-wide text-lg">{treatment.name}</p>
		</div>
		<div class="flex gap-x-4 overflow-hidden">
			<p class="font-medium text-surface-500 whitespace-nowrap">Giá dịch vụ:</p>
			<hr class="self-center flex-1 !border-surface-200" />
			<p
				title={String(formatCurrency(treatment.price))}
				class="text-end font-semibold tracking-wide text-lg overflow-hidden text-ellipsis"
			>
				{formatCurrency(treatment.price)}
			</p>
		</div>
		{#if treatment.materials.length > 0}
			<div class="col-span-3">
				<p class="font-medium text-surface-500 pr-4 bg-white z-10 relative w-fit">
					Vật tư được sử dụng:
				</p>
				<div
					class="border-t border-r border-b border-success-200 rounded-r-xl pt-4 -mt-3 bg-gradient-to-t overflow-hidden"
				>
					<table class="w-full">
						<thead>
							<tr>
								<th class="text-center px-2 py-2">#</th>
								<th class="text-start px-2 py-2">Vật tư</th>
								<th class="text-center px-2 py-2">Đơn vị</th>
								<th class="text-end pl-2 pr-6 py-2">Số lượng</th>
							</tr>
						</thead>
						<tbody>
							{#each treatment.materials as material, i (material.materialId)}
								<tr class="border-t odd:bg-slate-50">
									<td class="text-center px-2 py-2">{i + 1}</td>
									<td class="text-start px-2 py-2">{material.materialName}</td>
									<td class="text-center px-2 py-2">{material.unit}</td>
									<td class="text-end pl-2 pr-6 py-2">{material.quantity}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>
