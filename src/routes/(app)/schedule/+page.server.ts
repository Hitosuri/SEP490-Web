import { filterRoles, Role } from '$lib/authorization';
import { createAppointmentSchema } from '$lib/form-schemas/create-appointment-schema';
import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import endpoints from '$lib/endpoints';
import { scheduleFilterSchema } from '$lib/form-schemas/schedule-filter-schema';
import { createAppointmentPatientSchema } from '$lib/form-schemas/create-appointment-patient-schema';
import { editScheduleSchema } from '$lib/form-schemas/edit-schedule-schema';

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	filterRoles(locals, url, Role.Recieptionist, Role.Doctor, Role.Patient);
	const today = new Date();

	const searchParams = new URLSearchParams();
	searchParams.set('page', '1');
	searchParams.set('size', '1000');
	searchParams.set('startAt', `${today.getFullYear()}-${today.getMonth() + 1}-1`);
	searchParams.set('endAt', `${today.getFullYear()}-${today.getMonth() + 2}-1`);

	if (locals.user?.roles.includes(Role.Recieptionist)) {
		const r = await fetch(`${endpoints.schedule.getByRecieptionist}?${searchParams}`, {
			headers: {
				Authorization: `Bearer ${locals.user?.token}`
			}
		});

		const schedules: Pagination<ScheduleFull[]> = await r.json();
		schedules.data.forEach((x, i) => {
			x.startAt = new Date(x.startAt);
			x.endAt = x.endAt ? new Date(x.endAt) : undefined;
			x.order = i;
		});

		return {
			roleFor: Role.Recieptionist,
			createAppointmentForm: await superValidate(zod(createAppointmentSchema)),
			scheduleFilterForm: await superValidate(zod(scheduleFilterSchema)),
			editScheduleForm: await superValidate(zod(editScheduleSchema)),
			schedules: schedules
		} as const;
	} else if (locals.user?.roles.includes(Role.Patient)) {
		const [allSchedule, scheduleOfPatient] = await Promise.all([
			fetch(`${endpoints.schedule.getByPatient}?${searchParams}`, {
				headers: {
					Authorization: `Bearer ${locals.user?.token}`
				}
			}).then<Pagination<ScheduleByPatient[]>>((x) => x.json()),
			fetch(`${endpoints.schedule.getOwnByPatient}?${searchParams}`, {
				headers: {
					Authorization: `Bearer ${locals.user?.token}`
				}
			}).then<Pagination<ScheduleFull[]>>((x) => x.json())
		]);

		scheduleOfPatient.data.forEach((x, i) => {
			x.order = i;
			x.startAt = new Date(x.startAt);
			x.endAt = x.endAt ? new Date(x.endAt) : undefined;
		});

		const pendingSchedules = scheduleOfPatient.data.filter((x) => x.status === 1).map((x) => x.id);
		allSchedule.data = allSchedule.data.filter((x) => !pendingSchedules.includes(x.id));
		allSchedule.data.forEach((x) => {
			x.startAt = new Date(x.startAt);
			x.endAt = new Date(x.endAt);
		});

		return {
			roleFor: Role.Patient,
			allSchedule: allSchedule.data,
			patientSchedule: scheduleOfPatient.data,
			createAppointmentByPatientForm: await superValidate(zod(createAppointmentPatientSchema)),
			currentMonthValue: today.getFullYear() * 100 + today.getMonth() + 1
		} as const;
	}
};
