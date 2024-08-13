import { Role } from '$lib/helpers/authorization';

export function getRoleId(role: Role) {
	switch (role) {
		case Role.Admin:
			return 1;
		case Role.Accountant:
			return 2;
		case Role.Nurse:
			return 4;
		case Role.Recieptionist:
			return 5;
		case Role.Doctor:
			return 6;
		default:
			return 0;
	}
}

export function pascalToCamelcase(text: string) {
	return `${text.slice(0, 1)?.toLowerCase()}${text.slice(1)}`;
}

export function uppercaseFirstLetter(text: string) {
	return `${text.slice(0, 1)?.toUpperCase()}${text.slice(1)}`;
}
