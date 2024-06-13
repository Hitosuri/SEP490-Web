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
	userName: string;
	phone: string;
	birthday: Date;
	salary: number;
	status: number;
}

interface Pagination<T> {
	pageNumber: number;
	pageSize: number;
	totalRecords: number;
	data: T;
}
