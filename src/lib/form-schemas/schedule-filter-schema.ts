import { z } from 'zod';

const scheduleStatusKeys = ['1', '2', '3'] as const;

export const scheduleFilterSchema = z
	.object({
		patientPhone: z.string().trim(),
		doctorName: z.string().trim(),
		status: z.enum(scheduleStatusKeys),
		isPatientConfirm: z.boolean()
	})
	.partial();
