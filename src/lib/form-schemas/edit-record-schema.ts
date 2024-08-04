import { z } from 'zod';

export const editRecordSchema = z.object({
	reason: z.string(),
	diagnosis: z.string(),
	treatmentId: z.number().array(),
	recordExtraMaterialRequests: z
		.object({
			materialId: z.number(),
			quantity: z.number(),
			isBasicUnit: z.boolean().default(false)
		})
		.array()
});
