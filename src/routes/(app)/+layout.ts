import { browser } from '$app/environment';
import endpoints from '$lib/endpoints';
import { Role } from '$lib/helpers/authorization';
import { toast } from 'svelte-sonner';
import type { LayoutLoad } from './$types';
import NearEndScheduleToast from '$lib/components/schedule/NearEndScheduleToast.svelte';

export const load: LayoutLoad = async ({ parent, fetch }) => {
	const parentData = await parent();

	if (parentData.user?.roles.includes(Role.Doctor)) {
		try {
			const r = await fetch(endpoints.queue.get, {
				headers: {
					Authorization: `Bearer ${parentData.user.token}`
				}
			});

			if (r.ok) {
				const data: ApiResponse<QueueItem[]> = await r.json();

				if (data.body) {
					data.body.forEach((x) => {
						x.startAt = new Date(x.startAt);
						x.endAt = new Date(x.endAt);
					});

					if (browser) {
						data.body.forEach((x) => {
							const timeLeft = x.endAt.getTime() - new Date().getTime();

							if (timeLeft <= 0) {
								return;
							}

							const timeToShowToast = Math.max(0, timeLeft - 5 * 60 * 1000);
							const duration = timeLeft - timeToShowToast;
							const id = `queue-${x.id}`;

							if (duration < 1000) {
								return;
							}

							setTimeout(() => {
								toast.custom(NearEndScheduleToast, {
									important: true,
									dismissable: false,
									position: 'bottom-left',
									id,
									componentProps: {
										id,
										queueItem: x
									},
									delete: false,
									duration: duration
								});
							}, timeToShowToast);
						});
					}
				}
			}
		} catch (error) {
			console.log(error);
		}
	}
};
