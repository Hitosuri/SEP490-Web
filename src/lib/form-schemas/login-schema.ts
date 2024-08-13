import { z } from 'zod';

export const loginSchema = z.object({
	emailOrPhone: z.string().trim().min(1, 'Vui lòng điền email hoặc số điện thoại'),
	password: z.string().min(8, 'Mật khẩu cần tối thiểu 8 kí tự'),
	rememberMe: z.boolean().default(false),
	isUser: z.boolean().default(false)
});
