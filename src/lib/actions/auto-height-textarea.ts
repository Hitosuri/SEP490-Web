import type { Action } from 'svelte/action';

export const autoHeightTextArea: Action<
	HTMLTextAreaElement,
	{ minRows?: number; value?: string } | undefined
> = (el, options) => {
	el.style.overflow = 'hidden';
	el.style.resize = 'none';
	el.style.height = '0';

	const computedStyle = window.getComputedStyle(el);
	const outerHeight = parseInt(computedStyle.height, 10);
	const lineHeight = parseInt(computedStyle.lineHeight, 10);
	const diff = outerHeight - el.clientHeight;
	const paddingHeight = el.clientHeight;
	const minHeight = (options?.minRows ?? 1) * lineHeight + paddingHeight;
	let currentValue = '';
	let resizeTimer: NodeJS.Timeout | undefined;
	let lastWidth = Math.round(parseFloat(computedStyle.width));

	const resizeObserver = new ResizeObserver((entries) => {
		if (resizeTimer) {
			clearTimeout(resizeTimer);
		}

		resizeTimer = setTimeout(() => {
			if (Math.round(entries[0].contentRect.width) === lastWidth) {
				return;
			}

			lastWidth = Math.round(entries[0].contentRect.width);
			adjustHeight(el.value, true);
		}, 300);
	});

	if (typeof options?.value === 'string') {
		currentValue = options?.value;
	}

	el.style.height = `${minHeight + diff}px`;
	resizeObserver.observe(el);

	function adjustHeight(value: string, byResize: boolean = false) {
		if (!byResize && value === currentValue) {
			return;
		}

		if (value.length < currentValue.length || byResize) {
			el.style.height = '0';
		}

		const newHeight = Math.max(minHeight, el.scrollHeight);

		el.style.height = `${newHeight + diff}px`;
		currentValue = value ?? '';
	}

	function onInput(e: Event) {
		adjustHeight((e.target as HTMLTextAreaElement).value);
	}

	if (options?.value == null) {
		el.addEventListener('input', onInput);
	}

	return {
		update: (g) => {
			if (!g) {
				return;
			}

			adjustHeight(g.value ?? '');
		},
		destroy: () => {
			resizeObserver.disconnect();
			if (resizeTimer) {
				clearTimeout(resizeTimer);
			}
			el.removeEventListener('input', onInput);
		}
	};
};
