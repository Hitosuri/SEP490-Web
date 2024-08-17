import { env } from '$env/dynamic/public';

export default {
	auth: {
		loginUser: `${env.PUBLIC_API_HOST}/api/authentication`,
		loginPatient: `${env.PUBLIC_API_HOST}/api/authentication/LoginPatient`,
		resetPassword: (email: string) => `${env.PUBLIC_API_HOST}/api/authentication/reset/${email}`,
		resetPasswordPatient: (email: string) =>
			`${env.PUBLIC_API_HOST}/api/authentication/patient-reset/${email}`
	},
	profile: {
		getByUser: `${env.PUBLIC_API_HOST}/api/user/ViewProfile`,
		getByPatient: `${env.PUBLIC_API_HOST}/api/patient/ViewProfile`,
		edit: `${env.PUBLIC_API_HOST}/api/user/EditProfile`,
		changePasswordByUser: `${env.PUBLIC_API_HOST}/api/user/ChangePassword`,
		changePasswordByPatient: `${env.PUBLIC_API_HOST}/api/patient/ChangePassword`
	},
	users: {
		get: `${env.PUBLIC_API_HOST}/api/user/ListUser`,
		create: `${env.PUBLIC_API_HOST}/api/user`,
		edit: (id: number) => `${env.PUBLIC_API_HOST}/api/user/UpdateUser/${id}`,
		doctorSearch: `${env.PUBLIC_API_HOST}/api/user/doctors/search`,
		ban: `${env.PUBLIC_API_HOST}/api/user/BanUser`
	},
	patients: {
		get: `${env.PUBLIC_API_HOST}/api/patient/all`,
		create: `${env.PUBLIC_API_HOST}/api/patient`,
		detail: (id: number) => `${env.PUBLIC_API_HOST}/api/patient/${id}`,
		edit: (id: number) => `${env.PUBLIC_API_HOST}/api/patient/update/${id}`,
		ban: `${env.PUBLIC_API_HOST}/api/patient/BanPatient`
	},
	materials: {
		get: `${env.PUBLIC_API_HOST}/api/materials/all`,
		create: `${env.PUBLIC_API_HOST}/api/materials/create`,
		detail: (id: number) => `${env.PUBLIC_API_HOST}/api/materials/${id}`,
		edit: (id: number) => `${env.PUBLIC_API_HOST}/api/materials/update/${id}`,
		export: {
			get: `${env.PUBLIC_API_HOST}/api/materials/export-all`,
			create: `${env.PUBLIC_API_HOST}/api/export/create`,
			assign: `${env.PUBLIC_API_HOST}/api/export/assign`,
			edit: `${env.PUBLIC_API_HOST}/api/export/update`,
			detail: (id: string) => `${env.PUBLIC_API_HOST}/api/export/${id}`,
			deleteGroup: (id: string) =>
				`${env.PUBLIC_API_HOST}/api/export/export/remove/group:Guid?group=${id}`
		},
		import: {
			get: `${env.PUBLIC_API_HOST}/api/materials/import-history`,
			create: `${env.PUBLIC_API_HOST}/api/materials/import`
		}
	},
	availableMaterial: {
		get: `${env.PUBLIC_API_HOST}/api/avaliable-material/all`
	},
	materialTypes: {
		get: `${env.PUBLIC_API_HOST}/api/material-type/all`,
		create: `${env.PUBLIC_API_HOST}/api/material-type`,
		edit: (id: number) => `${env.PUBLIC_API_HOST}/api/material-type/${id}`
	},
	suppliers: {
		get: `${env.PUBLIC_API_HOST}/api/Supplier/all`,
		create: `${env.PUBLIC_API_HOST}/api/Supplier`,
		edit: (id: number) => `${env.PUBLIC_API_HOST}/api/Supplier/update/${id}`
	},
	schedule: {
		getByRecieptionist: `${env.PUBLIC_API_HOST}/api/schedules/GetListScheduleByRecieptionist`,
		getByPatient: `${env.PUBLIC_API_HOST}/api/schedules/GetListScheduleByPatient`,
		getOwnByPatient: `${env.PUBLIC_API_HOST}/api/schedules/GetListScheduleByPatientSelf`,
		getOwnByDoctor: `${env.PUBLIC_API_HOST}/api/schedules/GetListScheduleByDoctorId`,
		getByPatientId: (id: number) =>
			`${env.PUBLIC_API_HOST}/api/schedules/GetListScheduleByPatientId?size=1000&patientId=${id}`,
		createByRecieptionist: `${env.PUBLIC_API_HOST}/api/schedules/CreateByRecieptionist`,
		createByPatient: `${env.PUBLIC_API_HOST}/api/schedules/CreateByPatient`,
		editByRecieptionist: (id: number) =>
			`${env.PUBLIC_API_HOST}/api/schedules/UpdateByRecieptionist?scheduleId=${id}`,
		editByPatient: (id: number) =>
			`${env.PUBLIC_API_HOST}/api/schedules/UpdateByPatient?scheduleId=${id}`,
		deleteByRecieptionist: (id: number) =>
			`${env.PUBLIC_API_HOST}/api/schedules/DeletedSchedule/${id}`,
		deleteByPatient: (id: number) =>
			`${env.PUBLIC_API_HOST}/api/schedules/DeletedScheduleByPatient/${id}`,
		checkin: (id: number) =>
			`${env.PUBLIC_API_HOST}/api/schedules/CheckInSchedule?scheduleId=${id}`,
		pullSchedule: (doctorId: number) =>
			`${env.PUBLIC_API_HOST}/api/schedules/Reschedule?doctorId=${doctorId}`,
		confirmFromPatient: (token: string, confirmed: boolean) =>
			`${env.PUBLIC_API_HOST}/api/schedules/ConfirmScheduleByPatient?token=${encodeURIComponent(token)}&confirm=${confirmed}`,
		cancel: (id: number) => `${env.PUBLIC_API_HOST}/api/schedules/CanclSchedule?scheduleId=${id}`
	},
	records: {
		get: (id: number) => `${env.PUBLIC_API_HOST}/api/record/all/${id}`,
		detail: (id: number) => `${env.PUBLIC_API_HOST}/api/record/${id}`,
		edit: (id: number) => `${env.PUBLIC_API_HOST}/api/record/${id}`,
		end: (id: number) => `${env.PUBLIC_API_HOST}/api/record/end/${id}`
	},
	prescriptions: {
		create: `${env.PUBLIC_API_HOST}/api/Prescription/Create`,
		get: (id: number) => `${env.PUBLIC_API_HOST}/api/Prescription/${id}`,
		edit: (id: number) => `${env.PUBLIC_API_HOST}/api/Prescription/update/${id}`,
		detailCreate: `${env.PUBLIC_API_HOST}/api/Prescription/CreatePrescriptionDetail`,
		detailEdit: (id: number) =>
			`${env.PUBLIC_API_HOST}/api/Prescription/UpdatePrescriptionDetail/${id}`,
		detailDelete: (id: number) =>
			`${env.PUBLIC_API_HOST}/api/Prescription/DeletePrescriptionDetail?prescriptionDetailId=${id}`,
		pdf: (id: number) => `${env.PUBLIC_API_HOST}/api/Prescription/generate-pdf/${id}`
	},
	treatments: {
		get: `${env.PUBLIC_API_HOST}/api/Treatments`,
		create: `${env.PUBLIC_API_HOST}/api/Treatments`,
		detail: (id: number) => `${env.PUBLIC_API_HOST}/api/Treatments/${id}`,
		edit: (id: number) => `${env.PUBLIC_API_HOST}/api/Treatments/${id}`,
		delete: (id: number) => `${env.PUBLIC_API_HOST}/api/Treatments/${id}`
	},
	queue: {
		get: `${env.PUBLIC_API_HOST}/api/record/getbyDoctorId`
	},
	payment: {
		get: `${env.PUBLIC_API_HOST}/api/payment`,
		detail: (id: number) => `${env.PUBLIC_API_HOST}/api/payment/${id}`,
		confirm: (id: number) => `${env.PUBLIC_API_HOST}/api/payment/confirm/${id}`,
		reset: (id: number) => `${env.PUBLIC_API_HOST}/api/payment/reset/${id}`
	},
	statistics: {
		patient: `${env.PUBLIC_API_HOST}/api/statistics/StatisticByPatient`,
		scheduleAndDoctor: `${env.PUBLIC_API_HOST}/api/statistics/StatisticByScheduleAndDoctor`,
		material: `${env.PUBLIC_API_HOST}/api/statistics/material-statistic`,
		exportMaterial: `${env.PUBLIC_API_HOST}/api/statistics/export-material-statistic`
	}
};
