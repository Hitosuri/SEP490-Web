import { userRoles } from '$lib/authorization';
import { z } from 'zod';

export const sortableField = ['name', 'email', 'phone', 'salary'] as const;

export const userFilterSchema = z.object({
	// page: z.number().min(1).default(1),
	// size: z.number().min(1).default(10),
	name: z.string().trim(),
	email: z.string().trim(),
	phone: z.string().transform((val) => val.replace(/\D+/g, '')),
	fromSalary: z.number().min(0).default(0),
	toSalary: z.number().min(0).default(100000000),
	roles: z.array(z.enum(userRoles)).default([...userRoles])
	// orderBy: z.enum(sortableField).optional(),
	// asc: z.boolean().default(true)
});
