import { z } from 'zod';

export const invoiceFilterSchema = z.object({
	patientName: z.string().trim(),
	phoneNumber: z.string().trim(),
	email: z.string().trim(),
	doctorName: z.string().trim()
});
