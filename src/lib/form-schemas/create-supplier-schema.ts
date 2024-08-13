import { z } from 'zod';

export const createSupplierSchema = z.object({
	name: z.string().trim().min(1, 'Tên không được để trống'),
	email: z.string().trim().min(1, 'Email không được để trống'),
	address: z.string().trim().min(1, 'Địa chỉ không được để trống'),
	phone: z
		.string()
		.trim()
		.min(1, 'Số điện thoại không được để trống')
		.refine((value) => !value || /^\d{10}$/.test(value), 'Số điện thoại bao gồm 10 chữ số')
});
