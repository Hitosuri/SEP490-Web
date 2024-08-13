import { z } from 'zod';

export const materialTypeCreateSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Tên không được để trống')
		.max(100, 'Tên không được vượt quá 100 ký tự'),
	code: z
		.string()
		.trim()
		.min(1, 'Mã không được để trống')
		.max(50, 'Mã không được vượt quá 50 ký tự'),
	description: z.string().trim()
});
