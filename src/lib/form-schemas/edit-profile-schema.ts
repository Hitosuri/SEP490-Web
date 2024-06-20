import { z } from 'zod';

const msInDay = 1000 * 60 * 60 * 24;

export const editProfileSchema = z.object({
	name: z.string().min(1, 'Tên người dùng không được để trống'),
	phone: z.coerce
		.string()
		.min(10, 'Số điện thoại bao gồm 10 chữ số')
		.max(10, 'Số điện thoại bao gồm 10 chữ số')
		.refine((p) => /^\d+$/.test(p), 'Số điện thoại chỉ bao gồm chữ số'),
	birthday: z
		.date({
			required_error: 'Ngày sinh không được để trống'
		})
		.refine((date) => {
			const maxDate = new Date();
			maxDate.setHours(0, 0, 1, 0);
			return date.getTime() / msInDay < maxDate.getTime() / msInDay;
		}, 'Ngày sinh không được vượt qua ngày hiện tại')
});
