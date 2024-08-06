export enum ScheduleStatus {
	PENDING = 1,
	CONFIRMED = 2,
	DONE = 3,
	CANCEL = 4
}

export const scheduleStatusInfo = {
	[ScheduleStatus.PENDING]: {
		label: 'Đang chờ',
		styleClasses: ['bg-schedule-pending', 'border-schedule-pending', 'text-schedule-pending']
	},
	[ScheduleStatus.CONFIRMED]: {
		label: 'Xác nhận',
		styleClasses: ['bg-schedule-confirmed', 'border-schedule-confirmed', 'text-schedule-confirmed']
	},
	[ScheduleStatus.DONE]: {
		label: 'Đã tới',
		styleClasses: ['bg-schedule-done', 'border-schedule-done', 'text-schedule-done']
	},
	[ScheduleStatus.CANCEL]: {
		label: 'Đã huỷ',
		styleClasses: ['bg-schedule-done', 'border-schedule-done', 'text-schedule-done']
	}
} as const;

export const scheduleStepInMinute = 15;
export const scheduleStepInHour = scheduleStepInMinute / 60;
