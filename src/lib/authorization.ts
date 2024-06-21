import { error, redirect } from '@sveltejs/kit';
import { intersection } from 'lodash-es';

export enum Role {
	Admin = 'Admin',
	Doctor = 'Doctor',
	Nurse = 'Nurse',
	Recieptionist = 'Recieptionist',
	Accountant = 'Accountant',
	Patient = 'Patient',
	All = 'All',
	UnauthorizedOnly = 'UnauthorizedOnly'
}

export const allRoles = [
	Role.Admin,
	Role.Doctor,
	Role.Nurse,
	Role.Recieptionist,
	Role.Accountant,
	Role.Patient
] as const;

export const userRoles = [
	Role.Admin,
	Role.Doctor,
	Role.Nurse,
	Role.Recieptionist,
	Role.Accountant
] as const;

export const roleTranslation: Record<string, string> = {
	[Role.Admin]: 'Admin',
	[Role.Doctor]: 'Bác sĩ',
	[Role.Nurse]: 'Y tá',
	[Role.Recieptionist]: 'Lễ tân',
	[Role.Accountant]: 'Kế toán',
	[Role.Patient]: 'Bệnh nhân'
};

export function filterRoles(locals: App.Locals, url: URL, role: Role | Role[]): void {
	const roleArray = Array.isArray(role) ? role : [role];

	// Nếu người dùng đã đăng nhập
	if (locals.user) {
		// Trường hợp role route là UnauthorizedOnly
		if (roleArray.includes(Role.UnauthorizedOnly)) {
			error(403, {
				message: 'Bạn không được truy cập trang này'
			});
		}

		// Trường hợp role route là All hoặc role route khớp với role của người dùng
		if (!roleArray.includes(Role.All) && intersection(roleArray, locals.user.roles).length === 0) {
			error(401, {
				message: 'Bạn không có quyền truy cập trang này'
			});
		}
	} else {
		// Nếu người dùng chưa đăng nhập và role route không phải là UnauthorizedOnly
		if (!roleArray.includes(Role.UnauthorizedOnly)) {
			// Lấy ra url của request và cắt bỏ phần hostname để redirect tới khi đăng nhập thành công
			const backPath = encodeURI(url.href.substring(url.origin.length));

			redirect(301, `/auth/login?backTo=${backPath}`);
		}
	}
}
