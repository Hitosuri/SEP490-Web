<script lang="ts">
	import Breadcrumb from '$lib/components/common/Breadcrumb.svelte';
	import type { PageData } from './$types';
	import Container from '$lib/components/common/Container.svelte';
	import MaterialList from '$lib/components/materials/MaterialList.svelte';
	import { Tabs } from 'bits-ui';
	import MaterialTypeList from '$lib/components/materials/MaterialTypeList.svelte';
	import SupplierList from '$lib/components/materials/SupplierList.svelte';
	import usingSubFeature from '$lib/stores/using-subfeature-store';
	import ExportMaterialList from '$lib/components/materials/exports/ExportMaterialList.svelte';
	import ImportMaterialList from '$lib/components/materials/ImportMaterialList.svelte';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { Role } from '$lib/helpers/authorization';

	export let data: PageData;

	const userStore = getContext<Writable<UserBasic | undefined>>('user-store');
	let tabValue = 'material';
	let onMaterialTypeTabActive: () => void;
	let onSupplierTabActive: () => void;
	let onExportTabActive: () => void;
	let onImportTabActive: () => void;
</script>

<svelte:head>
	{#if tabValue === 'material'}
		<title>Danh sách vật tư</title>
	{:else if tabValue === 'material-type'}
		<title>Danh sách loại vật tư</title>
	{:else if tabValue === 'supplier'}
		<title>Danh sách nhà cung cấp</title>
	{:else if tabValue === 'export'}
		<title>Lịch sử xuất vật tư</title>
	{:else if tabValue === 'import'}
		<title>Lịch sử nhập vật tư</title>
	{/if}
</svelte:head>
<Container heightFull heightScreenMin paddingTopHeader class="pt-4 flex flex-col">
	<Breadcrumb crumbs={[{ label: 'Danh sách vật tư' }]} highlight />
	<Tabs.Root
		bind:value={tabValue}
		class="rounded-2xl bg-white shadow-md p-4 border"
		onValueChange={(value) => {
			if (value === 'material-type') {
				onMaterialTypeTabActive();
				usingSubFeature.set([
					{
						active: true,
						title: 'Loại vật tư',
						faIcon: 'fa-solid fa-stethoscope'
					}
				]);
			} else if (value === 'supplier') {
				onSupplierTabActive();
				usingSubFeature.set([
					{
						active: true,
						title: 'Nhà cung cấp',
						faIcon: 'fa-solid fa-boxes-packing'
					}
				]);
			} else if (value === 'export') {
				onExportTabActive();
				usingSubFeature.set([
					{
						active: true,
						title: 'Lịch sử xuất vật tư',
						faIcon: 'fa-solid fa-file-export'
					}
				]);
			} else if (value === 'import') {
				onImportTabActive();
				usingSubFeature.set([
					{
						active: true,
						title: 'Lịch sử nhập vật tư',
						faIcon: 'fa-solid fa-file-import'
					}
				]);
			} else {
				usingSubFeature.set(undefined);
			}
		}}
	>
		<Tabs.List class="bg-slate-300 p-1 rounded-lg flex gap-x-1">
			<Tabs.Trigger
				value="material"
				class="rounded-md h-10 flex-1 flex-shrink-0 data-[state=active]:bg-white data-[state=active]:shadow data-[state=inactive]:text-black/70 font-semibold"
			>
				Vật tư
			</Tabs.Trigger>
			{#if $userStore?.roles.includes(Role.Accountant)}
				<Tabs.Trigger
					value="import"
					class="rounded-md h-10 flex-1 flex-shrink-0 data-[state=active]:bg-white data-[state=active]:shadow data-[state=inactive]:text-black/70 font-semibold"
				>
					Lịch sử nhập
				</Tabs.Trigger>
			{/if}
			<Tabs.Trigger
				value="export"
				class="rounded-md h-10 flex-1 flex-shrink-0 data-[state=active]:bg-white data-[state=active]:shadow data-[state=inactive]:text-black/70 font-semibold"
			>
				Lịch sử xuất
			</Tabs.Trigger>
			<Tabs.Trigger
				value="material-type"
				class="rounded-md h-10 flex-1 flex-shrink-0 data-[state=active]:bg-white data-[state=active]:shadow data-[state=inactive]:text-black/70 font-semibold"
			>
				Loại vật tư
			</Tabs.Trigger>
			{#if $userStore?.roles.includes(Role.Accountant)}
				<Tabs.Trigger
					value="supplier"
					class="rounded-md h-10 flex-1 flex-shrink-0 data-[state=active]:bg-white data-[state=active]:shadow data-[state=inactive]:text-black/70 font-semibold"
				>
					Nhà cung cấp
				</Tabs.Trigger>
			{/if}
		</Tabs.List>
		<Tabs.Content value="material">
			<MaterialList
				materialFilterForm={data.materialFilterForm}
				materialListPage={data.materialListPage}
				createMaterialForm={data.createMaterialForm}
				importMaterialForm={data.importMaterialForm}
			/>
		</Tabs.Content>
		{#if $userStore?.roles.includes(Role.Accountant)}
			<Tabs.Content value="import">
				<ImportMaterialList
					bind:onTabActive={onImportTabActive}
					importMaterialFilterForm={data.importMaterialFilterForm}
				/>
			</Tabs.Content>
		{/if}
		<Tabs.Content value="export">
			<ExportMaterialList
				bind:onTabActive={onExportTabActive}
				createExportMaterialForm={data.createExportMaterialForm}
				editExportMaterialForm={data.editExportMaterialForm}
			/>
		</Tabs.Content>
		<Tabs.Content value="material-type">
			<MaterialTypeList
				materialTypeCreateForm={data.materialTypeCreateForm}
				bind:onTabActive={onMaterialTypeTabActive}
			/>
		</Tabs.Content>
		{#if $userStore?.roles.includes(Role.Accountant)}
			<Tabs.Content value="supplier">
				<SupplierList
					createSupplierForm={data.createSupplierForm}
					bind:onTabActive={onSupplierTabActive}
				/>
			</Tabs.Content>
		{/if}
	</Tabs.Root>
</Container>
