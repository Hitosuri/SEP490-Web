import { z } from 'zod';

export const createAppointmentPatientSchema = z.object({
	startAt: z.date(),
	doctorId: z.number().min(1, 'Vui lòng chọn bác sĩ'),
	description: z.string().trim().min(1, 'Vui lòng nhập mô tả')
});
