import { PUBLIC_API_HOST } from '$env/static/public';

export default {
	auth: {
		loginUser: `${PUBLIC_API_HOST}/api/authentication`,
		loginPatient: `${PUBLIC_API_HOST}/api/authentication/LoginPatient`,
		resetPassword: (email: string) => `${PUBLIC_API_HOST}/api/authentication/reset/${email}`
	},
	profile: {
		getByUser: `${PUBLIC_API_HOST}/api/user/ViewProfile`,
		getByPatient: `${PUBLIC_API_HOST}/api/patient/ViewProfile`,
		edit: `${PUBLIC_API_HOST}/api/user/EditProfile`,
		changePasswordByUser: `${PUBLIC_API_HOST}/api/user/ChangePassword`,
		changePasswordByPatient: `${PUBLIC_API_HOST}/api/patient/ChangePassword`
	},
	users: {
		get: `${PUBLIC_API_HOST}/api/user/ListUser`,
		create: `${PUBLIC_API_HOST}/api/user`,
		edit: (id: number) => `${PUBLIC_API_HOST}/api/user/UpdateUser/${id}`,
		doctorSearch: `${PUBLIC_API_HOST}/api/user/doctors/search`
	},
	patients: {
		get: `${PUBLIC_API_HOST}/api/patient/all`,
		create: `${PUBLIC_API_HOST}/api/patient`,
		detail: (id: number) => `${PUBLIC_API_HOST}/api/patient/${id}`,
		edit: (id: number) => `${PUBLIC_API_HOST}/api/patient/update/${id}`
	},
	materials: {
		get: `${PUBLIC_API_HOST}/api/materials/all`,
		create: `${PUBLIC_API_HOST}/api/materials/create`,
		detail: (id: number) => `${PUBLIC_API_HOST}/api/materials/${id}`,
		edit: (id: number) => `${PUBLIC_API_HOST}/api/materials/update/${id}`,
		import: `${PUBLIC_API_HOST}/api/materials/import`
	},
	materialTypes: {
		get: `${PUBLIC_API_HOST}/api/material-type/all`,
		create: `${PUBLIC_API_HOST}/api/material-type`,
		edit: (id: number) => `${PUBLIC_API_HOST}/api/material-type/${id}`
	},
	suppliers: {
		get: `${PUBLIC_API_HOST}/api/Supplier/all`,
		create: `${PUBLIC_API_HOST}/api/Supplier`,
		edit: (id: number) => `${PUBLIC_API_HOST}/api/Supplier/update/${id}`
	},
	schedule: {
		getByRecieptionist: `${PUBLIC_API_HOST}/api/schedules/GetListScheduleByRecieptionist`,
		getByPatient: `${PUBLIC_API_HOST}/api/schedules/GetListScheduleByPatient`,
		getOwnByPatient: `${PUBLIC_API_HOST}/api/schedules/GetListScheduleByPatientId`,
		getOwnByDoctor: `${PUBLIC_API_HOST}/api/schedules/GetListScheduleByDoctorId`,
		createByRecieptionist: `${PUBLIC_API_HOST}/api/schedules/CreateByRecieptionist`,
		createByPatient: `${PUBLIC_API_HOST}/api/schedules/CreateByPatient`,
		editByRecieptionist: (id: number) =>
			`${PUBLIC_API_HOST}/api/schedules/UpdateByRecieptionist?scheduleId=${id}`,
		deleteByRecieptionist: (id: number) => `${PUBLIC_API_HOST}/api/schedules/DeletedSchedule/${id}`,
		deleteByPatient: (id: number) =>
			`${PUBLIC_API_HOST}/api/schedules/DeletedScheduleByPatient/${id}`,
		checkin: (id: number) => `${PUBLIC_API_HOST}/api/schedules/CheckInSchedule?scheduleId=${id}`,
		pullSchedule: (doctorId: number) =>
			`${PUBLIC_API_HOST}/api/schedules/Reschedule?doctorId=${doctorId}`,
		confirmFromPatient: (token: string, confirmed: boolean) =>
			`${PUBLIC_API_HOST}/api/schedules/ConfirmScheduleByPatient?token=${encodeURIComponent(token)}&confirm=${confirmed}`
	},
	records: {
		get: (id: number) => `${PUBLIC_API_HOST}/api/record/all/${id}`,
		detail: (id: number) => `${PUBLIC_API_HOST}/api/record/${id}`,
		edit: (id: number) => `${PUBLIC_API_HOST}/api/record/${id}`,
		end: (id: number) => `${PUBLIC_API_HOST}/api/record/end/${id}`
	},
	prescriptions: {
		create: `${PUBLIC_API_HOST}/api/Prescription/Create`,
		get: (id: number) => `${PUBLIC_API_HOST}/api/Prescription/${id}`,
		edit: (id: number) => `${PUBLIC_API_HOST}/api/Prescription/update/${id}`,
		detailCreate: `${PUBLIC_API_HOST}/api/Prescription/CreatePrescriptionDetail`,
		detailEdit: (id: number) =>
			`${PUBLIC_API_HOST}/api/Prescription/UpdatePrescriptionDetail/${id}`,
		detailDelete: (id: number) =>
			`${PUBLIC_API_HOST}/api/Prescription/DeletePrescriptionDetail?prescriptionDetailId=${id}`,
		pdf: (id: number) => `${PUBLIC_API_HOST}/api/Prescription/generate-pdf/${id}`
	},
	treatments: {
		get: `${PUBLIC_API_HOST}/api/Treatments`
	},
	queue: {
		get: `${PUBLIC_API_HOST}/api/record/getbyDoctorId`
	},
	payment: {
		get: `${PUBLIC_API_HOST}/api/payment`,
		detail: (id: number) => `${PUBLIC_API_HOST}/api/payment/${id}`,
		confirm: (id: number) => `${PUBLIC_API_HOST}/api/payment/confirm/${id}`,
		reset: (id: number) => `${PUBLIC_API_HOST}/api/payment/reset/${id}`
	}
};
