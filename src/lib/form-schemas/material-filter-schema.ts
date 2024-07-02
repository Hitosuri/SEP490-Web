import { z } from 'zod';

export const materialFilterSchema = z.object({
	materialName: z.string().trim(),
	supplierName: z.string().trim(),
	materialType: z.number().int(),
	fromPrice: z.number().default(0),
	toPrice: z.number().default(0),
	fromQuantity: z.number().int().default(0),
	toQuantity: z.number().int().default(0)
});
