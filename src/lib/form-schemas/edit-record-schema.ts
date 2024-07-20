import { z } from 'zod';

export const editRecordSchema = z.object({
	reason: z.string(),
	diagnosis: z.string(),
	treatmentId: z.number().array(),
	extraMaterials: z
		.object({
			materialId: z.number(),
			quantity: z.number()
		})
		.array()
});
