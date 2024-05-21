import { z } from 'zod';

export const loginSchema = z.object({
	userName: z.string().min(1, 'Username không được để trống'),
	password: z.string().min(6, 'Mật khẩu cần tối thiểu 6 kí tự'),
	rememberMe: z.boolean().default(false)
});
