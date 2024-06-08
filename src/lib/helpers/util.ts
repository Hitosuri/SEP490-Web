const currencyFormatter = new Intl.NumberFormat('vi', {
	style: 'currency',
	currency: 'VND',
	currencySign: 'standard',
	currencyDisplay: 'symbol'
});
const fullDateFormatter = new Intl.DateTimeFormat('vi', {
	dateStyle: 'full'
});

export function formatCurrency(amount: number) {
	return currencyFormatter.format(amount);
}

export function formatFullDate(date: Date) {
	return fullDateFormatter.format(date);
}
