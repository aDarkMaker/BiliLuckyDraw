export const parseRoomId = (input: string): number | null => {
	const value = input.trim();
	if (!value) return null;

	if (/^\d+$/.test(value)) {
		return parseInt(value, 10);
	}

	const match = value.match(/^(?:https?:\/\/)?(?:www\.)?live\.bilibili\.com(?:\/(?:h5|blanc))?\/(\d+)(?:\/.*)?$/i);
	if (!match) return null;

	return parseInt(match[1], 10);
};
