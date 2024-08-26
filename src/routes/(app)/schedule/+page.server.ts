import { filterRoles, Role } from '$lib/helpers/authorization';
import { createAppointmentSchema } from '$lib/form-schemas/create-appointment-schema';
import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import endpoints from '$lib/endpoints';
import { scheduleFilterSchema } from '$lib/form-schemas/schedule-filter-schema';
import { createAppointmentPatientSchema } from '$lib/form-schemas/create-appointment-patient-schema';
import { editScheduleSchema } from '$lib/form-schemas/edit-schedule-schema';
import { UserFeature, userFeatureDetails } from '$lib/constants/user-feature-constant';
import { handleFetch } from '$lib/helpers/utils';

export const load: PageServerLoad = async ({ locals, url, fetch }) => {
	filterRoles(
		locals,
		url,
		...(userFeatureDetails[UserFeature.SCHEDULE_MANAGEMENT].roles ?? []),
		Role.Patient
	);
	const today = new Date();

	const searchParams = new URLSearchParams();
	searchParams.set('page', '1');
	searchParams.set('size', '1000');
	searchParams.set('startAt', `${today.getFullYear()}-${today.getMonth() + 1}-1`);
	searchParams.set('endAt', `${today.getFullYear()}-${today.getMonth() + 2}-1`);

	if (locals.user?.roles.includes(Role.Recieptionist)) {
		const [schedules, applications] = await Promise.all([
			handleFetch(
				fetch(`${endpoints.schedule.getByRecieptionist}?${searchParams}`, {
					headers: {
						Authorization: `Bearer ${locals.user?.token}`
					}
				})
			).then<Pagination<ScheduleFull[]>>((r) => r.json()),
			handleFetch(
				fetch(`${endpoints.application.getByUser}?${searchParams}&isConfirm=true`, {
					headers: {
						Authorization: `Bearer ${locals.user?.token}`
					}
				})
			).then<Pagination<Application[]>>((r) => r.json())
		]);

		schedules.data.forEach((x, i) => {
			x.startAt = new Date(x.startAt);
			x.endAt = x.endAt ? new Date(x.endAt) : undefined;
			x.order = i;
		});
		applications.data.forEach((x) => {
			x.startAt = new Date(x.startAt);
			x.endAt = new Date(x.endAt);
		});

		return {
			roleFor: Role.Recieptionist,
			createAppointmentForm: await superValidate(zod(createAppointmentSchema)),
			scheduleFilterForm: await superValidate(zod(scheduleFilterSchema)),
			editScheduleForm: await superValidate(zod(editScheduleSchema)),
			schedules: schedules,
			applications: applications
		} as const;
	} else if (locals.user?.roles.includes(Role.Patient)) {
		const [allSchedule, scheduleOfPatient, applications] = await Promise.all([
			handleFetch(
				fetch(`${endpoints.schedule.getByPatient}?${searchParams}`, {
					headers: {
						Authorization: `Bearer ${locals.user?.token}`
					}
				})
			).then<Pagination<ScheduleByPatient[]>>((x) => x.json()),
			handleFetch(
				fetch(`${endpoints.schedule.getOwnByPatient}?${searchParams}`, {
					headers: {
						Authorization: `Bearer ${locals.user?.token}`
					}
				})
			).then<Pagination<ScheduleFull[]>>((x) => x.json()),
			handleFetch(
				fetch(`${endpoints.application.getByUser}?${searchParams}&isConfirm=true`, {
					headers: {
						Authorization: `Bearer ${locals.user?.token}`
					}
				})
			).then<Pagination<Application[]>>((r) => r.json())
		]);

		scheduleOfPatient.data.forEach((x, i) => {
			x.order = i;
			x.startAt = new Date(x.startAt);
			x.endAt = x.endAt ? new Date(x.endAt) : undefined;
		});
		applications.data.forEach((x) => {
			x.startAt = new Date(x.startAt);
			x.endAt = new Date(x.endAt);
		});
		allSchedule.data.forEach((x) => {
			x.startAt = new Date(x.startAt);
			if (x.endAt) {
				x.endAt = new Date(x.endAt);
			} else {
				x.endAt = new Date(x.startAt);
				x.endAt.setMinutes(x.endAt.getMinutes() + 15);
			}
		});

		return {
			roleFor: Role.Patient,
			allSchedule: allSchedule.data,
			patientSchedule: scheduleOfPatient.data,
			applications: applications,
			createAppointmentByPatientForm: await superValidate(zod(createAppointmentPatientSchema)),
			currentMonthValue: today.getFullYear() * 100 + today.getMonth() + 1
		} as const;
	}
};
