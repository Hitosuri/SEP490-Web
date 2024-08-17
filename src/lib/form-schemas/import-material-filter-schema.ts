import { z } from 'zod';

export const importMaterialFilterSchema = z.object({
	fromDate: z.date().optional(),
	toDate: z.date().optional(),
	importBy: z.string(),
	importMaterialName: z.string(),
	quantity: z.number().default(0).optional()
});
