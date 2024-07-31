export enum UserFeature {
	USERS_MANAGEMENT = 1,
	SERVICES_MANAGEMENT = 2,
	MATERIALS_MANAGEMENT = 3,
	PATIENTS_MANAGEMENT = 4,
	SCHEDULE_MANAGEMENT = 5
}

export const userFeatureDetails: Record<UserFeature, UserFeatureDetail> = {
	[UserFeature.USERS_MANAGEMENT]: {
		id: UserFeature.USERS_MANAGEMENT,
		title: 'Nhân viên',
		faIcon: 'fa-users',
		hasDuotone: true,
		url: '/users'
	},
	[UserFeature.SERVICES_MANAGEMENT]: {
		id: UserFeature.SERVICES_MANAGEMENT,
		title: 'Dịch vụ',
		faIcon: 'fa-teeth-open',
		hasDuotone: true,
		url: '/services'
	},
	[UserFeature.MATERIALS_MANAGEMENT]: {
		id: UserFeature.MATERIALS_MANAGEMENT,
		title: 'Vật tư',
		faIcon: 'fa-capsules',
		hasDuotone: true,
		url: '/materials'
	},
	[UserFeature.PATIENTS_MANAGEMENT]: {
		id: UserFeature.PATIENTS_MANAGEMENT,
		title: 'Bệnh nhân',
		faIcon: 'fa-bed-pulse',
		hasDuotone: true,
		url: '/patients'
	},
	[UserFeature.SCHEDULE_MANAGEMENT]: {
		id: UserFeature.SCHEDULE_MANAGEMENT,
		title: 'Đặt lịch',
		faIcon: 'fa-calendar-range',
		hasDuotone: true,
		url: '/schedule'
	}
};
