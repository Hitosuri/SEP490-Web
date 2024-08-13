import { userRoles } from '$lib/helpers/authorization';
import { z } from 'zod';

export const userFilterSchema = z.object({
	name: z.string().trim(),
	email: z.string().trim(),
	phone: z.string().transform((val) => val.replace(/\D+/g, '')),
	fromSalary: z.number().min(0).default(0),
	toSalary: z.number().min(0).default(100000000),
	roles: z.array(z.enum(userRoles)).default([...userRoles])
});
