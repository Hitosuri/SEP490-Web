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
	roleId: string;
	email: string;
	uid: string;
}

interface JwtPayload {
	sub: string;
	jti: string;
	userId: string;
	roleId: string;
	nbf: number;
	exp: number;
	iat: number;
}
