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
	userId: string;
	role: string[];
	email: string;
	uid: string;
	token: string;
}

interface JwtPayload {
	sub: string;
	jti: string;
	userId: string;
	role: string | string[];
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
