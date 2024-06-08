import { PUBLIC_API_HOST } from '$env/static/public';

export default {
	auth: {
		login: `${PUBLIC_API_HOST}/api/authentication`
	},
	profile: {
		get: `${PUBLIC_API_HOST}/api/user/ViewProfile`,
		edit: `${PUBLIC_API_HOST}/api/user/EditProfile`
	}
};
