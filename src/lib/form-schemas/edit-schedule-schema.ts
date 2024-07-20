import { z } from 'zod';

export const editScheduleSchema = z.object({
	startAt: z.date(),
	endAt: z.date(),
	doctorId: z.number().gt(0),
	status: z.number().gt(0),
	description: z.string().min(1, 'Vui lòng nhập mô tả')
});
