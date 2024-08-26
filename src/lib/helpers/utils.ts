import { browser } from '$app/environment';
import { scheduleStepInHour, scheduleStepInMinute } from '$lib/constants/schedule-constant';
import { Role } from '$lib/helpers/authorization';
import { error, isHttpError } from '@sveltejs/kit';
import { setError, type SuperValidated } from 'sveltekit-superforms';

const defaultErrorMessage: Record<number, string> = {
	401: 'Bạn không có quyền truy cập trang này',
	403: 'Bạn không được truy cập trang này',
	404: 'Trạng bạn tìm kiếm không tồn tại',
	500: 'Lỗi xảy ra từ phía chủ'
};

export function getRoleId(role: Role) {
	switch (role) {
		case Role.Admin:
			return 1;
		case Role.Accountant:
			return 2;
		case Role.Nurse:
			return 4;
		case Role.Recieptionist:
			return 5;
		case Role.Doctor:
			return 6;
		default:
			return 0;
	}
}

export function pascalToCamelcase(text: string) {
	return `${text.slice(0, 1)?.toLowerCase()}${text.slice(1)}`;
}

export function uppercaseFirstLetter(text: string) {
	return `${text.slice(0, 1)?.toUpperCase()}${text.slice(1)}`;
}

export async function handleFetch(
	responsePromise: Promise<Response> | (() => Promise<Response>),
	messages: Record<number, string> = {},
	notThrowStatus: number[] = []
): Promise<Response> {
	return (typeof responsePromise === 'function' ? responsePromise() : responsePromise)
		.then(async (response) => {
			if (response.ok || notThrowStatus.includes(response.status)) {
				return response;
			}

			const bodyText = await response.text();
			let message = '';

			if (response.status === 500) {
				message = defaultErrorMessage[500] ?? '';
			} else if (!bodyText?.trim()) {
				message = defaultErrorMessage[response.status] ?? '';
			}

			if (!message) {
				try {
					const data = JSON.parse(bodyText);
					if (typeof data?.error === 'string') {
						message = data?.error;
					} else if (Array.isArray(data?.error) || Array.isArray(data)) {
						message = (data?.error ?? data).join(', ');
					} else if (typeof data.errors === 'object' || typeof data === 'object') {
						message = Object.values(data.errors ?? data).join(', ');
					}
				} catch (error) {
					message =
						{
							...defaultErrorMessage,
							...messages
						}[response.status] ?? bodyText;
				}
			}

			error(response.status, { message });
		})
		.catch((err) => {
			if (err?.cause?.code === 'ECONNREFUSED') {
				error(500, {
					message: 'Không kết nối được tới máy chú, vui lòng kiểm tra kết nối mạng hoặc thử lại sau'
				});
			}

			if (isHttpError(err)) {
				throw err;
			}

			error(500, { message: 'Xảy ra lỗi không xác định' });
		});
}

export async function handleToastFetch<T extends Record<string, unknown>>(
	responsePromise: Promise<Response> | (() => Promise<Response>),
	messages: Record<number | 'success', string> = {
		success: ''
	},
	afterSuccess: ((response: Response) => void | Promise<void>) | undefined | null = undefined,
	form: SuperValidated<T> | undefined | null = undefined,
	notThrowStatus: number[] = []
): Promise<string> {
	return (typeof responsePromise === 'function' ? responsePromise() : responsePromise)
		.then(async (response) => {
			if (response.ok || notThrowStatus.includes(response.status)) {
				return response;
			}

			const bodyText = await response.text();
			let message = '';

			if (response.status === 500) {
				message = defaultErrorMessage[500] ?? '';
			} else if (!bodyText?.trim()) {
				message = defaultErrorMessage[response.status] ?? '';
			}

			if (!message) {
				try {
					const data = JSON.parse(bodyText);
					if (typeof data?.error === 'string') {
						message = data?.error;
					} else if (Array.isArray(data?.error) || Array.isArray(data)) {
						message = (data?.error ?? data).join(', ');
					} else if (typeof data.errors === 'object' || typeof data === 'object') {
						const errorsDict = data.errors ?? data;
						if (form) {
							Object.keys(errorsDict).forEach((k) => {
								const fieldName = pascalToCamelcase(k);
								if (Object.keys(form.data).includes(fieldName)) {
									const value = Array.isArray(errorsDict[k]) ? errorsDict[k][0] : errorsDict[k];
									setError(form, fieldName, value);
								}
							});
						}
						message = Object.values(errorsDict).join(', ');
					}
				} catch (error) {
					message =
						{
							...defaultErrorMessage,
							...messages
						}[response.status] ?? bodyText;
				}
			}

			return Promise.reject(message);
		})
		.then((r) => afterSuccess?.(r))
		.then(() => messages['success'] ?? 'Thành công')
		.catch((err) => {
			if (err?.cause?.code === 'ECONNREFUSED') {
				return Promise.reject(
					'Không kết nối được tới máy chú, vui lòng kiểm tra kết nối mạng hoặc thử lại sau'
				);
			}

			throw err;
		});
}

export function downloadFile(blob: Blob, fileName: string) {
	if (!browser) {
		return;
	}

	const anchorElement = document.createElement('a');
	anchorElement.download = fileName;

	const href = URL.createObjectURL(blob);
	anchorElement.href = href;
	anchorElement.click();

	URL.revokeObjectURL(href);
}

export function getDayValue(time: Date | undefined | null) {
	if (!time) {
		return 0;
	}
	return time.getFullYear() * 10000 + time.getMonth() * 100 + time.getDate();
}

export function normalizeStartEnd(start: Date, end: Date | undefined | null): [number, number] {
	const normalizedStart = normalizeTime(start);
	return [normalizedStart, end ? normalizeTime(end) : normalizedStart + 1];
}

export function normalizeTime(time: Date) {
	return time.getHours() / scheduleStepInHour + time.getMinutes() / scheduleStepInMinute;
}
