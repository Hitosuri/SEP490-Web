import { z } from 'zod';

const msInDay = 1000 * 60 * 60 * 24;

export const editPatientSchema = z
	.object({
		name: z.string().trim(),
		email: z
			.string()
			.trim()
			.refine(
				(value) => !value || z.string().email().safeParse(value).success,
				'Vui lòng nhập đúng định dạng của email'
			),
		phone: z.coerce
			.string()
			.trim()
			.refine((value) => !value || /^\d{10}$/.test(value), 'Số điện thoại bao gồm 10 chữ số'),
		birthday: z.date().refine((date) => {
			const maxDate = new Date();
			maxDate.setHours(0, 0, 1, 0);
			maxDate.setMinutes(maxDate.getMinutes() - maxDate.getTimezoneOffset());
			return date.getTime() / msInDay < maxDate.getTime() / msInDay;
		}, 'Ngày sinh không được vượt qua ngày hiện tại')
	})
	.partial()
	.superRefine(({ email, phone }, ctx) => {
		if (!email && !phone) {
			ctx.addIssue({
				path: ['email'],
				message: 'Vui lòng nhập email hoặc số điện thoại',
				code: z.ZodIssueCode.custom
			});
			ctx.addIssue({
				path: ['phone'],
				message: 'Vui lòng nhập email hoặc số điện thoại',
				code: z.ZodIssueCode.custom
			});
		}
	});
