export const unreachable = '本地后端未运行，请启动开发桥接';

let httpPreferred = false;
let bridgeProbed = false;

export const callHTTP = async <T>(path: string, init?: RequestInit): Promise<T> => {
	const response = await fetch(path, init);
	const text = await response.text();

	if (!response.ok) {
		let detail = text.trim();
		try {
			const parsed = JSON.parse(text) as { error?: string };
			detail = parsed.error ?? detail;
		} catch {
			// Vite proxy answers 500 with an empty body when the bridge is down.
		}
		if (!detail) throw new Error(unreachable);
		throw new Error(detail);
	}

	if (!text) return undefined as T;
	return JSON.parse(text) as T;
};

export const probeHTTPBridge = async () => {
	if (bridgeProbed || typeof window === 'undefined') return httpPreferred;
	bridgeProbed = true;
	try {
		const response = await fetch('/api/lottery/status');
		if (response.ok) httpPreferred = true;
	} catch {
		// keep Wails path
	}
	return httpPreferred;
};

export const fallback = async <T>(remote: () => Promise<T>, http: () => Promise<T>): Promise<T> => {
	if (!bridgeProbed) await probeHTTPBridge();

	if (httpPreferred || !hasWailsRuntime()) {
		httpPreferred = true;
		return http();
	}

	try {
		return await remote();
	} catch (remoteError) {
		try {
			const value = await http();
			httpPreferred = true;
			return value;
		} catch (httpError) {
			const detail = describe(remoteError, httpError);
			throw new Error(detail ? `${detail} — ${unreachable}` : unreachable);
		}
	}
};

const hasWailsRuntime = () =>
	typeof window !== 'undefined' && !!(window as Window & { _wails?: unknown })._wails;

const describe = (remoteError: unknown, httpError: unknown): string => {
	const parts = [remoteError, httpError]
		.map((error) => (error instanceof Error ? error.message.trim() : ''))
		.filter((message) => message && message !== unreachable && !/failed to fetch|networkerror|load failed/i.test(message));
	return [...new Set(parts)].join(' / ');
};
