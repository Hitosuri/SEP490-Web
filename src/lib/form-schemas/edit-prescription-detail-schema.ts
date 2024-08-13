import { z } from 'zod';

export const editPrescriptionDetailSchema = z.object({
	quantiy: z
		.number({
			required_error: 'Vui lòng nhập số lượng',
			invalid_type_error: 'Chỉ nhập các chữ số'
		})
		.gt(0, 'Số lượng phải lớn hơn 0')
		.default(1),
	dosage: z.string().min(1, 'Vui lòng nhập liều dùng'),
	materialId: z.number().int().gt(0, 'Vui lòng chọn thuốc').default(0),
	isBasicUnit: z.boolean().default(false)
});
