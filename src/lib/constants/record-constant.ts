export enum RecordStatus {
	PROCESSING = 1,
	WAITTINGPAYMENT = 2,
	END = 3
}

export const recordStatusInfo = {
	[RecordStatus.PROCESSING]: {
		label: 'Đang tiến hành',
		styleClasses: ['bg-schedule-pending', 'border-schedule-pending', 'text-schedule-pending']
	},
	[RecordStatus.WAITTINGPAYMENT]: {
		label: 'Chờ thanh toán',
		styleClasses: ['bg-schedule-confirmed', 'border-schedule-confirmed', 'text-schedule-confirmed']
	},
	[RecordStatus.END]: {
		label: 'Đã kết thúc',
		styleClasses: ['bg-schedule-done', 'border-schedule-done', 'text-schedule-done']
	}
} as const;
