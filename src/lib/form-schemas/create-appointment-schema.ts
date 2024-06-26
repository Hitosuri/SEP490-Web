import { z } from 'zod';

export const createAppointmentSchema = z.object({
	startAt: z.date(),
	endAt: z.date(),
	patientId: z.number().min(1, 'Vui lòng chọn bệnh nhân'),
	doctorId: z.number().min(1, 'Vui lòng chọn bác sĩ'),
	description: z.string().trim()
});
