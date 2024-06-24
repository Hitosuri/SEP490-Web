import { z } from 'zod';

export const changePasswordSchema = z
	.object({
		oldPassword: z.string().min(8, 'Mật khẩu cũ cần tối thiểu 8 kí tự'),
		newPassword: z.string().min(8, 'Mật khẩu mới cần tối thiểu 8 kí tự'),
		confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu')
	})
	.refine((values) => values.newPassword === values.confirmPassword, {
		message: 'Mật khẩu được nhập lại không khớp',
		path: ['confirmPassword']
	})
	.refine((values) => values.newPassword !== values.oldPassword, {
		message: 'Mật khẩu mới không được giống mật khẩu cũ',
		path: ['newPassword']
	});
