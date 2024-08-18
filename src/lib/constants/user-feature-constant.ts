import { Role } from '$lib/helpers/authorization';

export enum UserFeature {
	USERS_MANAGEMENT = 1,
	SERVICES_MANAGEMENT = 2,
	MATERIALS_MANAGEMENT = 3,
	PATIENTS_MANAGEMENT = 4,
	SCHEDULE_MANAGEMENT = 5,
	PAYMENT_MANAGEMENT = 6,
	STATISTIC = 7
}

export const userFeatureDetails: Record<UserFeature, UserFeatureDetail> = {
	[UserFeature.USERS_MANAGEMENT]: {
		id: UserFeature.USERS_MANAGEMENT,
		title: 'Nhân viên',
		faIcon: 'fa-users',
		hasDuotone: true,
		url: '/users',
		lottieAnim: '/images/animations/user.lottie',
		class: 'from-sky-400 to-indigo-400',
		routes: ['/(app)/users'],
		roles: [Role.Admin]
	},
	[UserFeature.SERVICES_MANAGEMENT]: {
		id: UserFeature.SERVICES_MANAGEMENT,
		title: 'Dịch vụ',
		faIcon: 'fa-teeth-open',
		hasDuotone: true,
		url: '/services',
		lottieAnim: '/images/animations/treatment.lottie',
		class: 'from-emerald-400 to-lime-400',
		routes: ['/(app)/services'],
		roles: [Role.Doctor]
	},
	[UserFeature.MATERIALS_MANAGEMENT]: {
		id: UserFeature.MATERIALS_MANAGEMENT,
		title: 'Vật tư',
		faIcon: 'fa-capsules',
		hasDuotone: true,
		url: '/materials',
		lottieAnim: '/images/animations/material.lottie',
		class: 'from-yellow-400 to-orange-400',
		routes: ['/(app)/materials'],
		roles: [Role.Accountant, Role.Doctor, Role.Nurse]
	},
	[UserFeature.PATIENTS_MANAGEMENT]: {
		id: UserFeature.PATIENTS_MANAGEMENT,
		title: 'Bệnh nhân',
		faIcon: 'fa-bed-pulse',
		hasDuotone: true,
		url: '/patients',
		lottieAnim: '/images/animations/patient.lottie',
		class: 'from-pink-400 to-red-400',
		routes: ['/(app)/patients', '/(app)/records/[id]'],
		roles: [Role.Doctor, Role.Recieptionist]
	},
	[UserFeature.SCHEDULE_MANAGEMENT]: {
		id: UserFeature.SCHEDULE_MANAGEMENT,
		title: 'Đặt lịch',
		faIcon: 'fa-calendar-range',
		hasDuotone: true,
		url: '/schedule',
		lottieAnim: '/images/animations/schedule.lottie',
		class: 'from-indigo-400 to-purple-400',
		routes: ['/(app)/schedule'],
		roles: [Role.Recieptionist, Role.Patient]
	},
	[UserFeature.PAYMENT_MANAGEMENT]: {
		id: UserFeature.PAYMENT_MANAGEMENT,
		title: 'Hoá đơn',
		faIcon: 'fa-file-invoice',
		hasDuotone: true,
		url: '/invoices',
		lottieAnim: '/images/animations/invoice.lottie',
		class: 'from-teal-400 to-cyan-400',
		routes: ['/(app)/invoices'],
		roles: [Role.Recieptionist, Role.Accountant]
	},
	[UserFeature.STATISTIC]: {
		id: UserFeature.STATISTIC,
		title: 'Thống kê',
		faIcon: 'fa-chart-simple',
		hasDuotone: true,
		url: '/statistic',
		lottieAnim: '/images/animations/statistic.lottie',
		class: 'from-yellow-400 to-lime-400',
		routes: ['/(app)/statistic'],
		roles: [Role.Admin, Role.Accountant]
	}
};
