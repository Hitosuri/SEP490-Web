<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div
	class="h-full flex items-center bg-[url(https://interlakemecalux.cdnwm.com/img/blog/international-logistics.1.12.jpg)] bg-cover p-4"
>
	<LoginForm loginForm={data.loginForm} />
</div>
