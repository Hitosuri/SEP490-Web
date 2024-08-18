import { browser } from '$app/environment';
import { Role } from '$lib/helpers/authorization';
import { error, isHttpError } from '@sveltejs/kit';

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
