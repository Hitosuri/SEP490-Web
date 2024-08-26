import { z } from 'zod';

export const createTreatmentSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Tên dịch vụ không được để trống')
		.max(255, 'Tên dịch vụ không được vượt quá 255 kí tự'),
	price: z
		.number({
			invalid_type_error: 'Giá dịch vụ chỉ bao gồm số'
		})
		.gte(0, 'Giá dịch vụ không được âm'),
	materials: z
		.object({
			materialId: z.number().gt(0, 'Vui lòng chọn vật tư'),
			quantity: z
				.number({
					invalid_type_error: 'Số lượng chỉ bao gồm số'
				})
				.int('Số lượng phải là số nguyên')
				.positive('Số lượng phải là số dương'),
			isBasicUnit: z.boolean().default(false)
		})
		.array()
});
