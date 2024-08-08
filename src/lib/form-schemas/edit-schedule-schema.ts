import { z } from 'zod';

export const editScheduleSchema = z.object({
	startAt: z.date(),
	endAt: z.date(),
	doctorId: z.number().gt(0),
	status: z.number().gt(0),
	description: z.string().min(1, 'Vui lòng nhập mô tả'),
	scheduleForAnotherRequest: z
		.object({
			createForPatientName: z
				.string()
				.trim()
				.min(1, 'Vui lòng nhập tên bệnh nhân')
				.max(100, 'Tên bệnh nhân chỉ được tối đa 100 kí tự'),
			createForPatientAge: z
				.number({
					required_error: 'Vui lòng nhập số lượng',
					invalid_type_error: 'Chỉ nhập các chữ số'
				})
				.gt(0, 'Tuổi bệnh nhân cần lớn hơn 0')
				.max(200, 'Tuổi bệnh nhân quá lớn'),
			noteForPatientCreatedBy: z
				.string()
				.trim()
				.max(500, 'Chỉ được nhập tối đa 500 kí tự')
				.optional(),
			relationWithCurrentPatient: z
				.string()
				.trim()
				.min(1, 'Vui lòng nhập quan hệ với người giám hộ')
				.max(100, 'Chỉ được nhập tối đa 100 kí tự')
		})
		.optional()
});
