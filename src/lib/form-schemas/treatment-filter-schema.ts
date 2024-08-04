import { z } from 'zod';

export const treatmentFilterSchema = z.object({
	name: z.string().trim(),
	fromPrice: z.number().min(0),
	toPrice: z.number().min(0)
});
