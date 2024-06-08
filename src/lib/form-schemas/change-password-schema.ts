import { z } from 'zod';

export const changePasswordSchema = z
	.object({
		oldPassword: z.string().min(1, 'Mật khẩu cũ không được để chống'),
		newPassword: z.string().min(8, 'Mật khẩu cần tối thiểu 8 kí tự'),
		confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu')
	})
	.refine((values) => values.newPassword === values.confirmPassword, {
		message: 'Mật khẩu được nhập lại không khớp',
		path: ['confirmPassword']
	});
