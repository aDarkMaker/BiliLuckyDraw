export const parseJSON = <T>(raw: string | null | undefined, fallback: T): T => {
	if (!raw) return fallback;
	try {
		const value = JSON.parse(raw);
		return (value ?? fallback) as T;
	} catch {
		return fallback;
	}
};

export const errorMessage = (error: unknown): string => {
	if (error instanceof Error) return error.message;
	if (typeof error === 'string') return error;
	return String(error);
};
