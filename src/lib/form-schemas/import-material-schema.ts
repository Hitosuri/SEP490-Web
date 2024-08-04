import { z } from 'zod';

export const importMaterialSchema = z
	.object({
		materialId: z.number().gt(0),
		inputPrice: z.number().gte(0, 'Giá nhập không thể là số âm'),
		makeAt: z.date({ required_error: 'Vui lòng nhập ngày sản xuất' }),
		expiredAt: z.date({ required_error: 'Vui lòng nhập ngày hết hạn' }),
		fileSize: z.number().gt(0, 'Vui lòng chọn file')
	})
	.refine((values) => values.expiredAt > values.makeAt, {
		message: 'Ngày hết hạn phải sau ngày sản xuất',
		path: ['expiredAt']
	});
