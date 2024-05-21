import { superValidate } from 'sveltekit-superforms';
import type { LayoutServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/form-schemas/login-schema';

export const load: LayoutServerLoad = async () => {
	return {
		loginForm: await superValidate(zod(loginSchema))
	};
};
