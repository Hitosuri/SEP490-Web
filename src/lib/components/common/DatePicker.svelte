<script lang="ts">
	import { fly } from 'svelte/transition';
	import { DatePicker, type DatePickerProps } from 'bits-ui';
	import { type DateValue } from '@internationalized/date';
	import { twMerge } from 'tailwind-merge';
	import { createEventDispatcher } from 'svelte';
	import { CalendarDate } from '@internationalized/date';

	interface $$Props
		extends Omit<
			DatePickerProps,
			'onValueChange' | 'onPlaceholderChange' | 'onOpenChange' | 'onOutsideClick'
		> {
		regionInput?: string;
		regionTrigger?: string;
		regionSegment?: string;
		regionContent?: string;
		initValue?: Date | undefined;
	}

	export let regionInput = '';
	export let regionTrigger = '';
	export let regionSegment = '';
	export let regionContent = '';
	export let initValue: Date | undefined = undefined;

	const dispatcher = createEventDispatcher<{
		valueChange: Date | undefined;
		placeholderChange: Date | undefined;
		openChange: boolean;
		outsideClick: undefined;
	}>();
	const datePickerDefaultProp: DatePickerProps = {
		weekdayFormat: 'narrow',
		fixedWeeks: true,
		locale: 'vi',
		value: initValue
			? new CalendarDate(initValue.getFullYear(), initValue.getMonth() + 1, initValue.getDate())
			: undefined,
		...$$restProps
	};
	const cRegionInput = 'input flex h-[42px] select-none items-center p-2 rounded-container-token';
	const cRegionTrigger = 'ml-auto hover:variant-soft-surface p-1.5 btn text-lg';
	const cRegionSegment =
		'rounded px-1 hover:bg-surface-50 focus:bg-surface-50 focus:text-foreground outline-0 aria-[valuetext=Empty]:text-surface-300';
	const cRegionContent = 'x-50';

	$: classesRegionInput = twMerge(cRegionInput, regionInput);
	$: classesTrigger = twMerge(cRegionTrigger, regionTrigger);
	$: classesSegment = twMerge(cRegionSegment, regionSegment);
	$: classesContent = twMerge(cRegionContent, regionContent);

	function onValueChange(date: DateValue | undefined) {
		dispatcher('valueChange', date ? new Date(date.year, date.month - 1, date.day) : undefined);
	}

	function onPlaceholderChange(date: DateValue | undefined) {
		dispatcher(
			'placeholderChange',
			date ? new Date(date.year, date.month - 1, date.day) : undefined
		);
	}

	function onOpenChange(open: boolean) {
		dispatcher('openChange', open);
	}

	function onOutsideClick() {
		dispatcher('outsideClick');
	}
</script>

<DatePicker.Root
	{...datePickerDefaultProp}
	{onValueChange}
	{onPlaceholderChange}
	{onOpenChange}
	{onOutsideClick}
>
	<DatePicker.Input let:segments class={classesRegionInput}>
		{#each segments as { part, value }}
			<div class="inline-block select-none">
				{#if part === 'literal'}
					<DatePicker.Segment {part} class="p-1 opacity-60">
						{value}
					</DatePicker.Segment>
				{:else}
					<DatePicker.Segment {part} class={classesSegment}>
						{value}
					</DatePicker.Segment>
				{/if}
			</div>
		{/each}
		<DatePicker.Trigger class={classesTrigger}>
			<i class="fa-regular fa-calendar"></i>
		</DatePicker.Trigger>
	</DatePicker.Input>
	<DatePicker.Content
		sideOffset={12}
		transition={fly}
		transitionConfig={{ duration: 200, y: -30 }}
		class={classesContent}
	>
		<DatePicker.Calendar
			class="rounded-container-token border-surface-100 border bg-white p-5 shadow-lg"
			let:months
			let:weekdays
		>
			<DatePicker.Header class="flex items-center justify-between">
				<DatePicker.PrevButton class="size-10 p-2 hover:variant-soft-surface btn">
					<i class="fa-solid fa-chevron-left"></i>
				</DatePicker.PrevButton>
				<DatePicker.Heading class="text-[15px] font-semibold" />
				<DatePicker.NextButton class="size-10 p-2 hover:variant-soft-surface btn">
					<i class="fa-solid fa-chevron-right"></i>
				</DatePicker.NextButton>
			</DatePicker.Header>
			<div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
				{#each months as month}
					<DatePicker.Grid class="w-full border-collapse select-none space-y-1">
						<DatePicker.GridHead>
							<DatePicker.GridRow class="mb-1 flex w-full justify-between">
								{#each weekdays as day}
									<DatePicker.HeadCell class="w-10 rounded-md text-xs text-surface-400 font-medium">
										<div>{day.slice(0, 2)}</div>
									</DatePicker.HeadCell>
								{/each}
							</DatePicker.GridRow>
						</DatePicker.GridHead>
						<DatePicker.GridBody>
							{#each month.weeks as weekDates}
								<DatePicker.GridRow class="flex w-full">
									{#each weekDates as date}
										<DatePicker.Cell {date} class="relative size-10 !p-0 text-center text-sm">
											<DatePicker.Day
												{date}
												month={month.value}
												class="group relative font-medium inline-flex size-10 items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-transparent p-0 text-sm text-foreground transition-all hover:border-surface-700 data-[disabled]:pointer-events-none data-[outside-month]:pointer-events-none data-[selected]:bg-surface-700 data-[selected]:font-semibold data-[selected]:text-white data-[disabled]:text-surface-300 data-[unavailable]:text-surface-300 data-[unavailable]:line-through"
											>
												<div
													class="absolute top-[5px] hidden size-1 rounded-full bg-primary-400 transition-all group-data-[today]:block group-data-[selected]:bg-background"
												/>
												{date.day}
											</DatePicker.Day>
										</DatePicker.Cell>
									{/each}
								</DatePicker.GridRow>
							{/each}
						</DatePicker.GridBody>
					</DatePicker.Grid>
				{/each}
			</div>
		</DatePicker.Calendar>
	</DatePicker.Content>
</DatePicker.Root>
