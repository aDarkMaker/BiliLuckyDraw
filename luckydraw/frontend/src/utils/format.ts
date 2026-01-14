export const formatAvatarUrl = (url?: string): string => {
	if (!url) return '';
	if (url.startsWith('//')) {
		return `https:${url}`;
	}
	return url;
};
