import { z } from 'zod';

export const createMaterialSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Tên vật tư không được để trống')
		.max(255, 'Tên vật tư không được vượt quá 255 kí tự'),
	price: z.number().positive('Đơn giá phải là số dương'),
	materialTypeId: z
		.number({ required_error: 'Loại vật tư không được để trống' })
		.positive('Loại vật tư không được để trống'),
	supplierId: z
		.number({ required_error: 'Nhà cung cấp không được để trống' })
		.positive('Nhà cung cấp không được để trống'),
	unit: z
		.string()
		.trim()
		.min(1, 'Đơn vị không được để trống')
		.max(255, 'Đơn vị không được vượt quá 255 kí tự'),
	description: z
		.string()
		.trim()
		.min(1, 'Mô tả không được để trống')
		.max(255, 'Mô tả không được vượt quá 255 kí tự'),
	dosage: z.union([
		z.string().trim().max(255, 'Liều dùng không được vượt quá 255 kí tự').optional(),
		z.null()
	]),
	uses: z.union([z.string().trim().max(255, 'Cách dùng không được vượt quá 255 kí tự'), z.null()]),
	smallestUnit: z
		.string()
		.trim()
		.min(1, 'Đơn vị không được để trống')
		.max(255, 'Đơn vị không được vượt quá 255 kí tự'),
	smallestUnitQuantity: z
		.number()
		.int('Số lượng phải là số nguyên')
		.gt(0, 'Số lượng phải lớn hơn 0'),
	priceForSmallestUnit: z.union([
		z.number().nonnegative('Giá không thể là số âm').optional(),
		z.null()
	]),
	isSurcharge: z.boolean()
});
