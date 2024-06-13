import { userRoles } from '$lib/authorization';
import { z } from 'zod';

const msInDay = 1000 * 60 * 60 * 24;

export const createUserSchema = z.object({
	name: z.string().min(1, 'Tên nhân viên không dược để trống'),
	email: z
		.string()
		.min(1, 'Email không dược để trống')
		.email('Vui lòng nhập đúng định dạng của email'),
	userName: z.string().min(1, 'Tên đăng nhập không được để trống'),
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
			maxDate.setMinutes(maxDate.getMinutes() - maxDate.getTimezoneOffset());
			return date.getTime() / msInDay < maxDate.getTime() / msInDay;
		}, 'Ngày sinh không được vượt qua ngày hiện tại'),
	salary: z.number().min(0, 'Lương không thể là giá trị âm').default(0),
	roles: z.array(z.enum(userRoles)).nonempty('Nhân viên phải có ít nhât 1 vai trò')
});
