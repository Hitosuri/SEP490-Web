<script lang="ts">
	import Footer from '$lib/components/layout/Footer.svelte';
	import { getContext } from 'svelte';
	import { reveal } from 'svelte-reveal';
	import type { Writable } from 'svelte/store';
	import Container from '../common/Container.svelte';

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	const doctors: {
		img: string;
		name: string;
	}[] = [
		{
			name: 'Nguyễn Văn A',
			img: 'https://hips.hearstapps.com/hmg-prod/images/portrait-of-a-happy-young-doctor-in-his-clinic-royalty-free-image-1661432441.jpg?crop=0.66698xw:1xh;center,top&resize=1200:*'
		},
		{
			name: 'Phạm Thị B',
			img: 'https://graduate.northeastern.edu/resources/wp-content/uploads/sites/4/2023/01/DMSc-vs-DMHc-Whats-the-Difference-Hero.jpg'
		},
		{
			name: 'Trần Văn C',
			img: 'https://thumbs.dreamstime.com/b/handsome-hispanic-male-doctor-portrait-outdoors-smiling-63029492.jpg'
		},
		{
			name: 'Lê Quang D',
			img: 'https://img.freepik.com/free-photo/medium-shot-medical-specialist-standing-with-arms-pockets-looking-camera_1098-19294.jpg?size=626&ext=jpg&ga=GA1.1.2116175301.1717372800&semt=ais_user'
		}
	];
</script>

<svelte:head>
	<title>Nha khoa Trịnh</title>
	<link rel="stylesheet" href="/fa/css/thin.min.css" />
</svelte:head>
<div class="overflow-hidden h-[75vh] sm:h-[65vh] relative">
	<div
		class="text-white absolute z-[2] top-[54%] sm:top-[48%] md:top-[42%] lg:top-[36%] left-[10%] drop-shadow-md"
	>
		<p class="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-wider">Nha khoa</p>
		<p
			class="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-bold tracking-tighter drop-shadow-md"
		>
			Dr. Trịnh
		</p>
		{#if !$userStore}
			<a
				href="/schedule"
				class="btn lg:btn-lg xl:btn-xl gap-3 mt-4 font-semibold uppercase bg-gradient-to-r from-sky-800 to-teal-800"
			>
				<i class="fa-regular fa-calendar-check"></i>
				<span>Đặt lịch ngay</span>
			</a>
		{/if}
		<p class="text-sm mt-1 ml-6 text-teal-900 font-bold">
			<span class="text-white">SĐT:</span>
			097-509-4968
		</p>
	</div>
	<img
		class="w-full h-full object-cover object-right-top relative z-[1]"
		src="/images/banner-bg.png"
		alt="Ảnh bìa"
	/>
	<div class="absolute aspect-[2/3] md:aspect-square xl:w-1/2 h-full top-0 right-0">
		<img class="w-full h-full object-cover" src="/images/kham.jpg" alt="Khám" />
	</div>
</div>
<div class="h-[25vh] sm:h-[35vh] z-[5] relative">
	<div
		class="flex mx-auto w-fit -translate-y-12 shadow-lg shadow-black/20 text-white *:w-40 *:h-44 sm:*:w-44 sm:*:h-48 md:*:w-52 md:*:h-60 lg:*:w-60 lg:*:h-64 xl:*:w-64 xl:*:h-72 *:space-y-2 sm:*:space-y-3 md:*:space-y-4 lg:*:space-y-5 xl:*:space-y-6 *:pt-4 sm:*:pt-6 md:*:pt-8"
	>
		<div class="bg-teal-800">
			<div class="text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-center">
				<i class="fa-thin fa-door-open"></i>
			</div>
			<h3 class="text-center md:text-lg lg:text-xl font-medium">Thời gian mở cửa</h3>
			<p class="text-center px-1 text-xs sm:text-sm italic">
				Sáng: 8:00 - 11:30
				<br />
				Chiều: 14:00 - 17:00
			</p>
		</div>
		<div class="bg-teal-700">
			<div class="text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-center">
				<i class="fa-thin fa-user-doctor-hair"></i>
			</div>
			<h3 class="text-center md:text-lg lg:text-xl font-medium">Bác sĩ tay nghề cao</h3>
			<p class="text-center px-1 text-xs sm:text-sm italic">
				Luôn đảm bảo cá y bác sĩ là người tận tâm.
			</p>
		</div>
		<div class="bg-teal-600 hidden sm:block">
			<div class="text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-center">
				<i class="fa-thin fa-tooth"></i>
			</div>
			<h3 class="text-center md:text-lg lg:text-xl font-medium">Cấy ghép implant</h3>
			<p class="text-center px-1 text-xs sm:text-sm italic">
				Dịch vụ cấy ghép implant cao cấp.
			</p>
		</div>
		<div class="bg-teal-500 hidden lg:block">
			<div class="text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-center">
				<i class="fa-thin fa-stars"></i>
			</div>
			<h3 class="text-center md:text-lg lg:text-xl font-medium">Dịch vụ chất lượng</h3>
			<p class="text-center px-1 text-xs sm:text-sm italic">
				Luôn đảm bảo chất lượng dịch vụ.
			</p>
		</div>
	</div>
</div>
<!-- <div class="pt-24 pb-40 bg-slate-100">
	<div
		use:reveal={{
			preset: 'fly',
			x: -100,
			y: 0
		}}
		class="w-fit mx-auto flex gap-32 justify-center items-center sr__hide"
	>
		<div class="w-[440px] h-[500px] relative">
			<img
				class="h-full w-full object-cover rounded-lg"
				src="https://www.septodontusa.com/wp-content/uploads/2022/12/istock-1311280344-art-15-essential-communication-scaled.jpg"
				alt="Người khám"
			/>
			<div
				class="absolute -bottom-16 -right-12 py-6 px-8 bg-white rounded-lg shadow-lg w-4/5 space-y-3"
			>
				<p class="text-lg font-bold">Đặt lịch ngay hôm nay!</p>
				<p class="text-sm">
					Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ex repudiandae eius mollitia
					pariatur?
				</p>
			</div>
		</div>
		<div class="w-[400px] h-fit">
			<h2 class="h2 tracking-wider font-light">
				Lorem ipsum dolor sit amet consectetur adipisicing elit.
			</h2>
			<div class="space-y-8 mt-12">
				<p class="font-medium italic">
					"Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptas non harum impedit
					debitis accusantium!"
				</p>
				<p class="font-light">
					Lorem ipsum dolor sit amet consectetur adipisicing elit. Enim, culpa? Aut, magnam tenetur.
					Aliquid sit qui alias repellendus perspiciatis possimus, molestias consectetur cumque
					quia, est enim numquam eius at! Soluta!
				</p>
			</div>
		</div>
	</div>
</div> -->
<!-- <div
	use:reveal={{
		preset: 'fly',
		x: -100,
		y: 0
	}}
	class="py-20 sr__hide"
>
	<h1 class="text-center text-4xl font-semibold tracking-wide">Đội ngũ bác sĩ</h1>
	<div class="flex gap-6 justify-center mt-6">
		{#each doctors as doctor}
			<div class="w-52 p-2 shadow-lg">
				<div class="w-full aspect-square">
					<img class="object-cover w-full h-full" src={doctor.img} alt={doctor.name} />
				</div>
				<p class="pt-4 pb-2 text-center font-semibold">{doctor.name}</p>
			</div>
		{/each}
	</div>
</div> -->
<!-- <div
	use:reveal={{
		preset: 'fly',
		x: -100,
		y: 0
	}}
	class="h-96 bg-gradient-to-r from-sky-700 to-teal-600 flex container mx-auto rounded-lg overflow-hidden sr__hide"
>
	<div class="flex-[2] flex flex-col text-white">
		<div class="flex-1 border-b p-4 flex flex-col justify-center items-center">
			<h3 class="text-sm font-medium text-center">Số điện thoại</h3>
			<p class="text-xl font-bold mt-1 text-center">(212)-456-7890</p>
			<div class="flex gap-4 w-[340px] mt-4">
				<div class="flex-1">
					<div class="h-10 w-fit mx-auto">
						<img src="/images/icons/facebook.svg" class="h-full" alt="Facebook" />
					</div>
					<p class="text-center mt-1">fb.com/nhakhoatrinh</p>
				</div>
				<div class="flex-1">
					<div class="h-10 w-fit bg-white rounded-md mx-auto">
						<img src="/images/icons/zalo.svg" class="h-full" alt="Facebook" />
					</div>
					<p class="text-center mt-1">0912345678</p>
				</div>
			</div>
		</div>
		<div class="flex-1 pb-4 px-12 flex flex-col justify-center items-center">
			<h3 class="text-sm font-medium text-center">Địa chỉ</h3>
			<p class="text-xl font-semibold mt-1 text-center">
				Đường Vũ Lăng, xã Ngũ Hiệp, huyện Thanh Trì, thành phố Hà Nội
			</p>
		</div>
	</div>
	<div class="flex-[3] h-full">
		<iframe
			class="w-full h-full"
			title="Clinic map"
			src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3726.7025384850235!2d105.85267257525366!3d20.924283980698977!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjDCsDU1JzI3LjQiTiAxMDXCsDUxJzE4LjkiRQ!5e0!3m2!1svi!2s!4v1717884767350!5m2!1svi!2s"
			style="border:0;"
			allowfullscreen={true}
			loading="lazy"
			referrerpolicy="no-referrer-when-downgrade"
		/>
	</div>
</div> -->
<div
	use:reveal={{
		preset: 'fly',
		x: -100,
		y: 0
	}}
	class="sr__hide"
>
	<Container>
		<div
			class="grid grid-cols-12 text-white bg-gradient-to-r from-sky-700 to-teal-600 overflow-hidden rounded-lg"
		>
			<div
				class="col-span-12 sm:col-span-6 lg:col-span-5 border-b sm:border-r sm:border-b-0 lg:border-b lg:border-r-0 h-48 p-4 flex flex-col justify-center items-center order-1"
			>
				<h3 class="text-sm font-medium text-center">Số điện thoại</h3>
				<p class="text-xl font-bold mt-1 text-center">097-509-4968</p>
				<div class="flex gap-4 mt-4">
					<div class="flex-1">
						<div class="h-10 w-fit mx-auto">
							<img src="/images/icons/facebook.svg" class="h-full" alt="Facebook" />
						</div>
						<p class="text-center mt-1 whitespace-nowrap">fb.com/Nhakhoabacsytrinh.con</p>
					</div>
					<div class="flex-1">
						<div class="h-10 w-fit bg-white rounded-md mx-auto">
							<img src="/images/icons/zalo.svg" class="h-full" alt="Facebook" />
						</div>
						<p class="text-center mt-1 whitespace-nowrap">097-509-4968</p>
					</div>
				</div>
			</div>
			<div
				class="col-span-12 sm:col-span-6 lg:col-span-5 h-36 sm:h-48 py-2 px-12 flex flex-col justify-center items-center order-2 lg:order-3"
			>
				<h3 class="text-sm font-medium text-center">Địa chỉ</h3>
				<p class="text-xl font-semibold mt-1 text-center">
					Đường Vũ Lăng, xã Ngũ Hiệp, huyện Thanh Trì, thành phố Hà Nội
				</p>
			</div>
			<div class="col-span-12 h-48 lg:h-auto lg:col-span-7 lg:row-span-2 order-3 lg:order-2">
				<iframe
					class="w-full h-full"
					title="Clinic map"
					src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3726.7025384850235!2d105.85267257525366!3d20.924283980698977!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjDCsDU1JzI3LjQiTiAxMDXCsDUxJzE4LjkiRQ!5e0!3m2!1svi!2s!4v1717884767350!5m2!1svi!2s"
					style="border:0;"
					allowfullscreen={true}
					loading="lazy"
					referrerpolicy="no-referrer-when-downgrade"
				/>
			</div>
		</div>
	</Container>
</div>
<div class="h-20"></div>
<Footer />
