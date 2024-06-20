import { userRoles } from '$lib/authorization';
import { z } from 'zod';

// const msInDay = 1000 * 60 * 60 * 24;

export const editUserSchema = z.object({
	id: z.number(),
	phone: z.coerce
		.string()
		.min(10, 'Số điện thoại bao gồm 10 chữ số')
		.max(10, 'Số điện thoại bao gồm 10 chữ số')
		.refine((p) => /^\d+$/.test(p), 'Số điện thoại chỉ bao gồm chữ số'),
	// birthday : z
	// 	.date({
	// 		required_error: 'Ngày sinh không được để trống'
	// 	})
	// 	.refine((date) => {
	// 		const maxDate = new Date();
	// 		maxDate.setHours(0, 0, 1, 0);
	// 		maxDate.setMinutes(maxDate.getMinutes() - maxDate.getTimezoneOffset());
	// 		return date.getTime() / msInDay < maxDate.getTime() / msInDay;
	// 	}, 'Ngày sinh không được vượt qua ngày hiện tại'),
	salary: z.number().min(0, 'Lương không thể là giá trị âm').default(0),
	status: z.boolean().default(true),
	assistantId: z.number(),
	roles: z.array(z.enum(userRoles)).nonempty('Nhân viên phải có ít nhât 1 vai trò')
});
