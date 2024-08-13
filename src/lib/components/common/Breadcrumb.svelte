<script lang="ts">
	export let crumbs: Crumb[];
	export let rootLabel = 'Trang chủ';
	export let highlight = false;
</script>

<ol
	class="text-zinc-500 my-2 items-center font-medium py-1.5 flex flex-wrap gap-x-1 sm:gap-x-2 gap-y-2 text-sm sm:text-base rounded-container-token {highlight
		? 'border bg-white px-1.5'
		: ''}"
>
	<li class="select-none cursor-default">
		<a class="btn py-1 hover:variant-soft-tertiary {highlight ? 'rounded' : ''}" href="/"
			>{rootLabel}</a
		>
	</li>
	<li class="text-zinc-400 text-sm" aria-hidden>
		<i class="fa-solid fa-chevron-right"></i>
	</li>
	{#each crumbs as crumb, i}
		{#if i < crumbs.length - 1}
			<li>
				{#if crumb.href}
					<a
						class="btn py-1 hover:variant-soft-tertiary {highlight ? 'rounded' : ''}"
						href={crumb.href}
					>
						{crumb.label}
					</a>
				{:else}
					{crumb.label}
				{/if}
			</li>
			<li class="text-zinc-400 text-sm" aria-hidden>
				<i class="fa-solid fa-chevron-right"></i>
			</li>
		{:else}
			<li class="cursor-default py-1 px-5">{crumb.label}</li>
		{/if}
	{/each}
</ol>
