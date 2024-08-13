import { browser } from '$app/environment';

type MinuteTickCallback = (time: Date) => void;

export class MinuteTick {
	static #events = new Set<MinuteTickCallback>();
	static #timer: NodeJS.Timeout | undefined;

	public static addEvent(cb: MinuteTickCallback) {
		if (!browser) {
			return;
		}

		MinuteTick.#events.add(cb);

		if (MinuteTick.#timer) {
			return;
		}

		MinuteTick.trigger();
	}

	public static removeEvent(cb: MinuteTickCallback) {
		if (!browser) {
			return;
		}

		MinuteTick.#events.delete(cb);

		if (MinuteTick.#events.size === 0) {
			MinuteTick.clearTimer();
		}
	}

	public static clear() {
		if (!browser) {
			return;
		}

		MinuteTick.#events.clear();

		if (MinuteTick.#events.size === 0) {
			MinuteTick.clearTimer();
		}
	}

	private static clearTimer() {
		if (MinuteTick.#timer) {
			clearTimeout(MinuteTick.#timer);
			MinuteTick.#timer = undefined;
		}
	}

	private static trigger() {
		const nextMinute = new Date();
		nextMinute.setSeconds(0);
		nextMinute.setMilliseconds(0);
		nextMinute.setMinutes(nextMinute.getMinutes() + 1);

		MinuteTick.#timer = setTimeout(() => {
			MinuteTick.#events.forEach((x) => x(nextMinute));
			MinuteTick.clearTimer();
			MinuteTick.trigger();
		}, nextMinute.getTime() - new Date().getTime());
	}
}
