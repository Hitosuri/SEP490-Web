import { z } from 'zod';

export const editExportMaterialSchema = z.object({
	exportMaterialGroup: z.string().trim(),
	exportMaterialAssignments: z
		.object({
			exportMaterialId: z.number(),
			availableMaterialIds: z.number().array()
		})
		.array()
});
