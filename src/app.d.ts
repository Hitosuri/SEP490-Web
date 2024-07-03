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
	id: string;
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
	status: number;
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
	status: 200;
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
}

interface MaterialType {
	id: number;
	name: string;
	code: string;
}

interface Suppiler {
	name: string;
	email: string;
	address: string;
	phoneNumber: string;
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
