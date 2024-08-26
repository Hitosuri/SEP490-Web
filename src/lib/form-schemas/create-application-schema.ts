import { z } from 'zod';

export const createApplicationSchema = z.object({
	startAt: z.date({ required_error: 'Vui lòng chọn ngày bắt đầu' }),
	endAt: z.date({ required_error: 'Vui lòng chọn ngày kết thúc' }),
	reason: z.string().trim().min(1, 'Vui lòng nhập lý do')
});
