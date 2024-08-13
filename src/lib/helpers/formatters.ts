const currencyFormatter = new Intl.NumberFormat('vi', {
	style: 'currency',
	currency: 'VND',
	currencySign: 'standard',
	currencyDisplay: 'symbol'
});
const fullDateFormatter = new Intl.DateTimeFormat('vi', {
	dateStyle: 'full'
});
const compactDateFormatter = new Intl.DateTimeFormat('vi', {
	year: 'numeric',
	day: '2-digit',
	month: '2-digit'
});

export function formatCurrency(amount: number | undefined | null): string {
	if (amount == null) {
		return '';
	}
	return currencyFormatter.format(amount);
}

export function formatFullDate(date: Date | undefined | null): string {
	if (!date) {
		return '';
	}
	return fullDateFormatter.format(date);
}

export function formatCompactDate(date: Date | undefined | null): string {
	if (!date) {
		return '';
	}
	return compactDateFormatter.format(date);
}

export function formatCompactDateTime(date: Date | undefined | null): string {
	if (!date) {
		return '';
	}
	return `${formatHourMinute(date)} - ${formatCompactDate(date)}`;
}

export function formatHourMinute(date: Date | undefined | null): string {
	if (!date) {
		return '';
	}
	return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatISODateWithOffset(date: Date | undefined | null): string {
	if (!date) {
		return '';
	}
	const tmp = new Date(date);
	tmp.setMinutes(tmp.getMinutes() - tmp.getTimezoneOffset());
	return tmp.toISOString().slice(0, -1) + getTimezoneOffset(tmp);
}

function pad(n: number) {
	return `${Math.floor(Math.abs(n))}`.padStart(2, '0');
}

function getTimezoneOffset(date: Date) {
	const tzOffset = -date.getTimezoneOffset();
	const diff = tzOffset >= 0 ? '+' : '-';
	return diff + pad(tzOffset / 60) + ':' + pad(tzOffset % 60);
}
