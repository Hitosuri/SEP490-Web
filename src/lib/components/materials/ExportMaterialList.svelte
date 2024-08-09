<script lang="ts">
	export function onTabActive() {
		if (firstActive) {
			return;
		}

		firstActive = true;
		// filtering('', '', currentPage, pageSize, true, true, true);
	}

	let firstActive = false;
</script>

<h1 class="text-4xl font-semibold px-8 py-6 text-surface-900">Danh sách xuất vật tư</h1>
