import { z } from 'zod';

export const loginSchema = z.object({
	userName: z.string().min(1, 'Tên đăng nhập không được để trống'),
	password: z.string().min(8, 'Mật khẩu cần tối thiểu 8 kí tự'),
	rememberMe: z.boolean().default(false)
});
