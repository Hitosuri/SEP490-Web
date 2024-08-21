import { z } from 'zod';

export const applicationFilterSchema = z
	.object({
		userName: z.string().trim(),
		startAt: z.date(),
		endAt: z.date(),
		isConfirm: z.boolean()
	})
	.partial();
