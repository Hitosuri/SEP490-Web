<script>
	import Container from '../common/Container.svelte';
</script>

<div class="bg-surface-900">
	<Container class="text-white">
		<div class="border-b border-surface-600 py-12 flex justify-between items-start">
			<div>
				<img class="h-12" src="/images/prodental-white.png" alt="" />
			</div>
			<div>
				<h4 class="text-lg uppercase font-medium">Site map</h4>
				<div class="font-light space-y-1 mt-6">
					<p>Dịch vụ</p>
					<p>Tư vấn</p>
					<p>Về chúng tôi</p>
				</div>
			</div>
			<div>
				<h4 class="text-lg uppercase font-medium">Liên hệ với chúng tôi</h4>
				<div class="flex mt-6 justify-evenly">
					<div class="size-16 bg-white rounded-full flex justify-center items-center">
						<a href="https://www.facebook.com/Nhakhoabacsytrinh.con" target="_blank">
							<img src="/images/icons/facebook.svg" class="h-10" alt="Facebook" />
						</a>
					</div>
					<div class="size-16 bg-white rounded-full flex justify-center items-center">
						<a href="https://zalo.me/0975094968" target="_blank">
							<img src="/images/icons/zalo.svg" class="h-10" alt="Facebook" />
						</a>
					</div>
				</div>
			</div>
		</div>
		<p class="text-center pt-4 pb-8 text-sm">
			©2024,
			<a href="/" title="nhakhoatrinh.com" class="hover:underline">nhakhoatrinh.com</a>
		</p>
	</Container>
</div>
