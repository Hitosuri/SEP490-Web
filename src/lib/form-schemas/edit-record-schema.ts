import { z } from 'zod';

export const editRecordSchema = z.object({
	reason: z.string(),
	diagnosis: z.string(),
	treatmentId: z.number().array(),
	recordExtraMaterialRequests: z
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
