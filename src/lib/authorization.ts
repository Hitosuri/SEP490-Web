import { error, redirect } from '@sveltejs/kit';

export enum Role {
	Admin = 'admin',
	Doctor = 'doctor',
	Nurse = 'nurse',
	Accountant = 'accountant',
	Patient = 'patient',
	All = 'all',
	Test = '1'
}

export function filterRoles(
	locals: App.Locals,
	url: URL,
	roles: { include?: Role[]; exclude?: Role[] } | Role[]
) {
	const backPath = encodeURI(url.href.substring(url.origin.length));

	if (Array.isArray(roles)) {
		if (!locals.user) {
			redirect(301, `/auth/login?backTo=${backPath}`);
		}

		if (roles.includes(Role.All)) {
			return;
		}

		if (!(<unknown[]>roles).includes(locals.user.roleId)) {
			error(401, {
				message: 'Bạn không có quyền truy cập trang này'
			});
		}
	} else {
		if (!locals.user && (roles.include?.length ?? -1) > 0) {
			redirect(301, `/auth/login?backTo=${backPath}`);
		}

		if (locals.user) {
			if (roles.include?.includes(Role.All)) {
				return;
			}

			if (roles.include && !(<unknown[]>roles.include).includes(locals.user.roleId)) {
				error(401, {
					message: 'Bạn không có quyền truy cập trang này'
				});
			}

			if (roles.exclude?.includes(Role.All)) {
				redirect(301, '/');
			}

			if ((<unknown[] | undefined>roles.include)?.includes(locals.user.roleId)) {
				error(401, {
					message: 'Bạn không có quyền truy cập trang này'
				});
			}
		}
	}
}
