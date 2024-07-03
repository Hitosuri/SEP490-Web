import { z } from 'zod';

export const createMaterialSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Tên vật liệu không được để trống')
		.max(255, 'Tên vật liệu không được vượt quá 255'),
	price: z.number().positive('Đơn giá phải là số dương'),
	materialTypeId: z
		.number({ required_error: 'Loại vật liệu không được để trống' })
		.positive('Loại vật liệu không được để trống'),
	supplierId: z
		.number({ required_error: 'Nhà cung cấp không được để trống' })
		.positive('Nhà cung cấp không được để trống'),
	unit: z
		.string()
		.trim()
		.min(1, 'Đơn vị không được để trống')
		.max(255, 'Đơn vị không được vượt quá 255'),
	description: z
		.string()
		.trim()
		.min(1, 'Mô tả không được để trống')
		.max(255, 'Mô tả không được vượt quá 255')
});
