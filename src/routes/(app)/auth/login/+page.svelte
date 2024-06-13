<script lang="ts">
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div
	class="h-screen flex items-center bg-cover p-4"
	style="background-image: url(/images/login-bg.jpg);"
>
	<LoginForm loginForm={data.loginForm} />
</div>
