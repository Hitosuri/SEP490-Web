<script lang="ts">
	import { DateRangePicker, type DateRange, type DateRangePickerProps } from 'bits-ui';
	import { fly } from 'svelte/transition';
	import { twMerge } from 'tailwind-merge';
	import { createEventDispatcher } from 'svelte';
	import { CalendarDate, type DateValue } from '@internationalized/date';

	interface $$Props
		extends Omit<
			DateRangePickerProps,
			'onValueChange' | 'onPlaceholderChange' | 'onOpenChange' | 'onOutsideClick'
		> {
		regionInput?: string;
		regionTrigger?: string;
		regionSegment?: string;
		regionContent?: string;
		initValue?: [Date | undefined, Date | undefined];
	}

	export let regionInput = '';
	export let regionTrigger = '';
	export let regionSegment = '';
	export let regionContent = '';
	export let initValue: [Date | undefined, Date | undefined] | undefined = undefined;

	const dispatcher = createEventDispatcher<{
		valueChange: [Date | undefined, Date | undefined] | undefined;
		placeholderChange: Date | undefined;
		openChange: boolean;
		outsideClick: undefined;
	}>();
	const dateRangePickerDefaultProp: DateRangePickerProps = {
		weekdayFormat: 'narrow',
		fixedWeeks: true,
		locale: 'vi',
		value: initValue
			? {
					start: initValue[0]
						? new CalendarDate(
								initValue[0].getFullYear(),
								initValue[0].getMonth() + 1,
								initValue[0].getDate()
							)
						: undefined,
					end: initValue[1]
						? new CalendarDate(
								initValue[1].getFullYear(),
								initValue[1].getMonth() + 1,
								initValue[1].getDate()
							)
						: undefined
				}
			: undefined,
		...$$restProps
	};
	const cRegionInput = 'input flex h-[42px] select-none items-center p-2 rounded-container-token';
	const cRegionTrigger = 'ml-auto hover:variant-soft-surface p-1.5 btn text-lg';
	const cRegionSegment =
		'rounded px-0.5 hover:bg-surface-50 focus:bg-surface-50 focus:text-foreground outline-0 aria-[valuetext=Empty]:text-surface-300';
	const cRegionContent = 'z-50';

	$: classesRegionInput = twMerge(cRegionInput, regionInput);
	$: classesTrigger = twMerge(cRegionTrigger, regionTrigger);
	$: classesSegment = twMerge(cRegionSegment, regionSegment);
	$: classesContent = twMerge(cRegionContent, regionContent);

	function onValueChange(date: DateRange | undefined) {
		dispatcher(
			'valueChange',
			date
				? [
						date.start
							? new Date(date.start.year, date.start.month - 1, date.start.day)
							: undefined,
						date.end ? new Date(date.end.year, date.end.month - 1, date.end.day) : undefined
					]
				: undefined
		);
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

<DateRangePicker.Root
	{...dateRangePickerDefaultProp}
	{onValueChange}
	{onPlaceholderChange}
	{onOpenChange}
	{onOutsideClick}
>
	<DateRangePicker.Input let:segments class={classesRegionInput}>
		{#each segments.start as { part, value }}
			<div class="inline-block select-none">
				{#if part === 'literal'}
					<DateRangePicker.Segment type="start" {part} class="p-0.5 opacity-60">
						{value}
					</DateRangePicker.Segment>
				{:else}
					<DateRangePicker.Segment type="start" {part} class={classesSegment}>
						{value}
					</DateRangePicker.Segment>
				{/if}
			</div>
		{/each}
		<div aria-hidden class="px-3 text-muted-foreground">–</div>
		{#each segments.end as { part, value }}
			<div class="inline-block select-none">
				{#if part === 'literal'}
					<DateRangePicker.Segment type="end" {part} class="p-0.5 opacity-60">
						{value}
					</DateRangePicker.Segment>
				{:else}
					<DateRangePicker.Segment type="end" {part} class={classesSegment}>
						{value}
					</DateRangePicker.Segment>
				{/if}
			</div>
		{/each}
		<DateRangePicker.Trigger class={classesTrigger}>
			<i class="fa-regular fa-calendar"></i>
		</DateRangePicker.Trigger>
	</DateRangePicker.Input>
	<DateRangePicker.Content
		sideOffset={12}
		transition={fly}
		transitionConfig={{ duration: 200, y: -30 }}
		class={classesContent}
	>
		<DateRangePicker.Calendar
			class="rounded-container-token border-surface-100 border bg-white p-5 shadow-lg"
			let:months
			let:weekdays
		>
			<DateRangePicker.Header class="flex items-center justify-between">
				<DateRangePicker.PrevButton class="size-10 p-2 hover:variant-soft-surface btn">
					<i class="fa-solid fa-chevron-left"></i>
				</DateRangePicker.PrevButton>
				<DateRangePicker.Heading class="text-[15px] font-semibold" />
				<DateRangePicker.NextButton class="size-10 p-2 hover:variant-soft-surface btn">
					<i class="fa-solid fa-chevron-right"></i>
				</DateRangePicker.NextButton>
			</DateRangePicker.Header>
			<div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
				{#each months as month}
					<DateRangePicker.Grid class="w-full border-collapse select-none space-y-1">
						<DateRangePicker.GridHead>
							<DateRangePicker.GridRow class="mb-1 flex w-full justify-between">
								{#each weekdays as day}
									<DateRangePicker.HeadCell
										class="w-10 rounded-md text-xs text-surface-400 font-medium"
									>
										<div>{day.slice(0, 2)}</div>
									</DateRangePicker.HeadCell>
								{/each}
							</DateRangePicker.GridRow>
						</DateRangePicker.GridHead>
						<DateRangePicker.GridBody>
							{#each month.weeks as weekDates}
								<DateRangePicker.GridRow class="flex w-full">
									{#each weekDates as date}
										<DateRangePicker.Cell {date} class="relative size-10 !p-0 text-center text-sm">
											<DateRangePicker.Day
												{date}
												month={month.value}
												class="group relative font-medium inline-flex size-10 items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-transparent p-0 text-sm text-foreground transition-all hover:border-surface-700 data-[disabled]:pointer-events-none data-[outside-month]:pointer-events-none data-[selected]:bg-surface-50/50 data-[selection-start]:!bg-surface-700 data-[selection-start]:font-semibold data-[selection-start]:text-white data-[selection-start]:rounded-r-none data-[selection-end]:!bg-surface-700 data-[selection-end]:font-semibold data-[selection-end]:text-white data-[selection-end]:rounded-l-none data-[selection-start]:data-[selection-end]:rounded-md data-[selected]:[&:not([data-selection-start])]:[&:not([data-selection-end])]:rounded-none data-[disabled]:text-surface-300 data-[unavailable]:text-surface-300 data-[unavailable]:line-through"
											>
												<div
													class="absolute top-[5px] hidden size-1 rounded-full bg-primary-400 transition-all group-data-[today]:block group-data-[selected]:bg-background"
												/>
												{date.day}
											</DateRangePicker.Day>
										</DateRangePicker.Cell>
									{/each}
								</DateRangePicker.GridRow>
							{/each}
						</DateRangePicker.GridBody>
					</DateRangePicker.Grid>
				{/each}
			</div>
		</DateRangePicker.Calendar>
	</DateRangePicker.Content>
</DateRangePicker.Root>
