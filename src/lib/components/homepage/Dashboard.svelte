<script>
	import FunctionCard from '$lib/components/homepage/FunctionCard.svelte';
</script>

<svelte:head>
	<title>Bảng chức năng - Nha khoa Trịnh</title>
</svelte:head>
<div class="p-4 pt-[5.5rem] container mx-auto">
	<div class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 p-4 border rounded-xl">
		<FunctionCard
			lottieAnimUrl="/images/animations/user.lottie"
			title="Nhân viên"
			class="from-sky-400 to-indigo-400"
			href="/users"
		/>
		<FunctionCard
			lottieAnimUrl="/images/animations/treatment.lottie"
			title="Phương pháp trị liệu"
			class="from-yellow-400 to-orange-400"
		/>
		<FunctionCard
			lottieAnimUrl="/images/animations/material.lottie"
			title="Thuốc/Dụng cụ"
			class="from-indigo-400 to-purple-400"
			href="/materials"
		/>
		<FunctionCard
			lottieAnimUrl="/images/animations/patient.lottie"
			title="Bệnh nhân"
			class="from-pink-400 to-red-400"
			href="/patients"
		/>
		<FunctionCard
			lottieAnimUrl="/images/animations/schedule.lottie"
			title="Đặt lịch"
			class="from-emerald-400 to-lime-400"
		/>
	</div>
</div>
