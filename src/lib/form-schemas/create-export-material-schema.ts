import { z } from 'zod';

export const createExportMaterialSchema = z.object({
	exportMaterialRequests: z
		.object({
			note: z.string(),
			materialId: z.number().gt(0, 'Vui lòng chọn vật tư'),
			quantity: z.number().gt(0, 'Số lượng phải lớn hơn 0')
		})
		.array()
		.min(1, 'Vui lòng chọn tối thiểu 1 vật tư')
});
