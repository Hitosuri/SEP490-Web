<script lang="ts">
	import { Role } from '$lib/helpers/authorization';
	import ScheduleByPatient from '$lib/components/schedule/patient/ScheduleByPatient.svelte';
	import ScheduleByRecieptionist from '$lib/components/schedule/recieptionist/ScheduleByRecieptionist.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

{#if data.roleFor === Role.Recieptionist}
	<ScheduleByRecieptionist
		applications={data.applications.data}
		initialSchedule={data.schedules.data}
		createAppointmentForm={data.createAppointmentForm}
		scheduleFilterForm={data.scheduleFilterForm}
		editScheduleForm={data.editScheduleForm}
	/>
{:else if data.roleFor === Role.Patient}
	<ScheduleByPatient
		applications={data.applications.data}
		allSchedule={data.allSchedule}
		patientSchedules={data.patientSchedule}
		currentMonthValue={data.currentMonthValue}
		createAppointmentByPatientForm={data.createAppointmentByPatientForm}
	/>
{/if}
