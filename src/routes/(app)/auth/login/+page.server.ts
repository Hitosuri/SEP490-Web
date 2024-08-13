import { filterRoles, Role } from '$lib/helpers/authorization';
import { superValidate } from 'sveltekit-superforms';
import type { PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/form-schemas/login-schema';

export const load: PageServerLoad = async ({ locals, url }) => {
	filterRoles(locals, url, Role.UnauthorizedOnly);
	return {
		loginForm: await superValidate(zod(loginSchema))
	};
};
