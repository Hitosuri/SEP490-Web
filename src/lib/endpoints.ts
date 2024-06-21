import { PUBLIC_API_HOST } from '$env/static/public';

export default {
	auth: {
		loginUser: `${PUBLIC_API_HOST}/api/authentication`,
		loginPatient: `${PUBLIC_API_HOST}/api/authentication/LoginPatient`,
		resetPassword: (email: string) => `${PUBLIC_API_HOST}/api/authentication/reset/${email}`
	},
	profile: {
		get: `${PUBLIC_API_HOST}/api/user/ViewProfile`,
		edit: `${PUBLIC_API_HOST}/api/user/EditProfile`,
		changePassword: `${PUBLIC_API_HOST}/api/user/ChangePassword`
	},
	users: {
		get: `${PUBLIC_API_HOST}/api/user/ListUser`,
		create: `${PUBLIC_API_HOST}/api/user`,
		edit: (id: number) => `${PUBLIC_API_HOST}/api/user/UpdateUser/${id}`
	},
	patients: {
		get: `${PUBLIC_API_HOST}/api/patient/all`,
		create: `${PUBLIC_API_HOST}/api/patient`,
		detail: (id: number) => `${PUBLIC_API_HOST}/api/patient/${id}`,
		edit: (id: number) => `${PUBLIC_API_HOST}/api/patient/update/${id}`
	}
};
