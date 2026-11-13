export const formatCount = (value?: number | null): string => {
	const n = Number(value) || 0;
	if (n < 10000) return String(n);
	if (n < 100_000_000) return `${Number((n / 10000).toFixed(n >= 100000 ? 0 : 1))}万`;
	return `${Number((n / 100_000_000).toFixed(2))}亿`;
};
