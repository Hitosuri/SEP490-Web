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
	if (!amount) {
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
