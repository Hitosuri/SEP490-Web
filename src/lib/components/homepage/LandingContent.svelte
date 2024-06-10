<script lang="ts">
	import Footer from '$lib/components/Footer.svelte';
	import { reveal } from 'svelte-reveal';

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
<div class="overflow-hidden h-[65vh]">
	<img class="w-full h-full object-cover object-top" src="/images/banner.jpg" alt="Ảnh bìa" />
</div>
<div class="h-[35vh]">
	<div
		class="flex mx-auto w-fit -translate-y-12 shadow-lg shadow-black/20 text-white *:w-64 *:h-72 *:space-y-6 *:pt-8"
	>
		<div class="bg-teal-800">
			<div class="text-7xl text-center">
				<i class="fa-thin fa-door-open"></i>
			</div>
			<h3 class="text-center text-xl font-medium">Thời gian mở cửa</h3>
			<p class="text-center text-sm italic">
				Lorem ipsum dolor sit amet, consectetur adipisicing elit.
			</p>
		</div>
		<div class="bg-teal-700">
			<div class="text-7xl text-center">
				<i class="fa-thin fa-user-doctor-hair"></i>
			</div>
			<h3 class="text-center text-xl font-medium">Bác sĩ tay nghề cao</h3>
			<p class="text-center text-sm italic">
				Lorem ipsum dolor sit amet, consectetur adipisicing elit.
			</p>
		</div>
		<div class="bg-teal-600">
			<div class="text-7xl text-center">
				<i class="fa-thin fa-tooth"></i>
			</div>
			<h3 class="text-center text-xl font-medium">Cấy ghép implant</h3>
			<p class="text-center text-sm italic">
				Lorem ipsum dolor sit amet, consectetur adipisicing elit.
			</p>
		</div>
		<div class="bg-teal-500">
			<div class="text-7xl text-center">
				<i class="fa-thin fa-stars"></i>
			</div>
			<h3 class="text-center text-xl font-medium">Dịch vụ chất lượng</h3>
			<p class="text-center text-sm italic">
				Lorem ipsum dolor sit amet, consectetur adipisicing elit.
			</p>
		</div>
	</div>
</div>
<div class="pt-24 pb-40 bg-slate-100">
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
</div>
<div
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
</div>
<div
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
</div>
<div class="h-20"></div>
<Footer />
