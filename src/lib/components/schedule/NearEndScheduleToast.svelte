<script lang="ts">
	import { formatHourMinute } from '$lib/helpers/formatters';
	import { toast } from 'svelte-sonner';

	export let id: string;
	export let queueItem: QueueItem;

	function closeToast() {
		toast.dismiss(id);
	}
</script>

<div
	class="p-6 bg-error-50 border-2 border-error-300 shadow-lg shadow-error-500/20 rounded-container-token flex gap-4 w-96"
>
	<div class="text-xl text-error-500">
		<i class="fa-solid fa-circle-exclamation"></i>
	</div>
	<div class="flex-1">
		<div class="flex">
			<p class="flex-1 text-xl font-semibold">Chú ý</p>
			<button type="button" class="btn-icon text-xl size-7" on:click={closeToast}>
				<i class="fa-solid fa-xmark"></i>
			</button>
		</div>
		<div class="mt-2 space-y-1">
			<p>
				Thời gian khám theo lịch hẹn của bệnh nhân
				<span class="font-medium">{queueItem.patientName}</span>
				sắp kết thúc.
			</p>
			<p>
				Thời gian kết thúc:
				<span class="font-medium">{formatHourMinute(queueItem.endAt)}</span>
			</p>
		</div>
	</div>
</div>
