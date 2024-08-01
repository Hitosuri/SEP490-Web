// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

// and what to do when importing types
declare namespace App {
	interface PageState {
		loginModal?: boolean;
	}

	interface Locals {
		user?: UserBasic;
	}

	// interface PageData {}

	interface Error {
		messages?: string[];
	}

	// interface Platform {}
}

interface UserBasic {
	id: number;
	roles: string[];
	email: string;
	uid: string;
	token: string;
	isPatient: boolean;
}

interface JwtPayload {
	sub: string;
	jti: string;
	userId: string;
	role?: string | string[];
	nbf: number;
	exp: number;
	iat: number;
}

interface User {
	id: number;
	name: string;
	email: string;
	phone: string;
	birthday: Date;
	salary: number;
	status: number;
	roles: Role[];
}

interface Profile {
	name: string;
	email: string;
	phone: string;
	birthday: Date;
	salary: number;
}

interface Patient {
	id: number;
	name: string | undefined | null;
	email: string | undefined | null;
	phone: string | undefined | null;
	birthday: Date | undefined | null;
}

interface Pagination<T> {
	pageNumber: number;
	pageSize: number;
	totalRecords: number;
	data: T;
}

interface ApiResponse<T, E = string> {
	status: number;
	error?: E;
	body?: T;
}

interface Crumb {
	label: string;
	href?: string;
}

interface Material {
	id: number;
	name: string;
	price: number;
	quantity: number;
	supplierName: string;
	materialTypeName: string;
	medicine?: Medicine;
}

interface MaterialType {
	id: number;
	name: string;
	code: string;
}

interface Suppiler {
	id: number;
	name: string;
	email: string;
	address: string;
	phoneNumber: string;
}

interface ScheduleFull {
	id: number;
	startAt: Date;
	endAt?: Date;
	doctor: UserMinimal;
	patient: PatientInSchedule;
	status: import('$lib/constants/schedule-constant').ScheduleStatus;
	isPatientConfirm: boolean;
	description?: string;
	order: number;
}

interface RecordListItem {
	id: number;
	doctorName: string;
	doctorPhone: string;
	visitDate: Date;
	diagnosis: string;
	reason: string;
	isReVisit: boolean;
	status: import('$lib/constants/record-constant').RecordStatus;
}

interface QueueItem {
	id: number;
	patientName: string;
	doctorName: string;
	exportId: number;
	diagnostic: string;
	reason: string;
	status: number;
	startAt: Date;
	endAt: Date;
	isReVisit: boolean;
}

interface RecordPatient {
	doctor: UserMinimal;
	patient: UserMinimal;
	status: import('$lib/constants/record-constant').RecordStatus;
	diagnostic: string;
	reason: string;
	prescriptionId: number;
	recordTreatmentListItemDtos: {
		implementerName: string;
		implementerPhone: string;
		note: string;
		treatmentName: string;
		treatmentId: number;
		actionAt: Date;
		number: number;
	}[];
	usedMaterials: {
		materialId: number;
		materialName: string;
		quantity: number;
		unit: string;
	}[];
}

interface Prescription {
	id: number;
	date: Date;
	indication: string;
	recordId: number;
	createAt: Date;
	createBy: UserMinimal;
	details: PrescriptionDetail[];
	patients: UserMinimal;
}

interface PrescriptionDetail {
	id: number;
	quantiy: number;
	medicineDetail: MedicineDetail;
}

interface Medicine {
	id: number;
	dosage: string;
	uses: string;
}

interface MedicineDetail extends Medicine {
	name: string;
	price: number;
	quantity: number;
	weight: number;
	unit: string;
	description: string;
}

interface ScheduleByPatient {
	id: number;
	startAt: Date;
	endAt: Date;
	doctor: UserMinimal;
}

interface UserMinimal {
	id: number;
	name: string;
}

interface PatientInSchedule {
	id: number;
	name: string;
	phone: string;
	age: number;
}

interface Treatment {
	id: number;
	name: string;
	price: number;
	deleted: boolean;
}

type TableField<T> = {
	[K in keyof T]: {
		displayName: string;
		name: K;
		sortable?: boolean;
		align?: 'left' | 'center' | 'right';
		formatter?: (value: T[K]) => string;
		href?: (value: T) => string;
	};
}[keyof T];

interface UserFeatureDetail {
	id: import('$lib/constants/user-feature-constant').UserFeature;
	title: string;
	faIcon: string;
	hasDuotone: boolean;
	url: string;
	lottieAnim: string;
	class: string;
}
