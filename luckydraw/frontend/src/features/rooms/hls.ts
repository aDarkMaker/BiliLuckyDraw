export type HlsInstance = {
	loadSource: (url: string) => void;
	attachMedia: (media: HTMLMediaElement) => void;
	destroy: () => void;
	startLoad: (startPosition?: number) => void;
	recoverMediaError: () => void;
	on: (event: string, cb: (event: string, data: HlsErrorData) => void) => void;
	off: (event: string, cb: (event: string, data: HlsErrorData) => void) => void;
};

export type HlsErrorData = {
	fatal?: boolean;
	type?: string;
	details?: string;
};

type HlsConstructor = new (config?: Record<string, unknown>) => HlsInstance;

export type HlsModule = HlsConstructor & {
	isSupported: () => boolean;
	Events: { ERROR: string };
	ErrorTypes: {
		NETWORK_ERROR: string;
		MEDIA_ERROR: string;
	};
};

let loading: Promise<HlsModule> | null = null;

const hlsGlobal = () => (window as unknown as { Hls?: HlsModule }).Hls;

export const loadHls = (): Promise<HlsModule> => {
	const existing = hlsGlobal();
	if (existing) return Promise.resolve(existing);
	if (loading) return loading;

	loading = new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
		script.async = true;
		script.onload = () => {
			const Hls = hlsGlobal();
			if (!Hls) {
				reject(new Error('hls.js missing'));
				return;
			}
			resolve(Hls);
		};
		script.onerror = () => reject(new Error('hls.js failed to load'));
		document.head.appendChild(script);
	});

	return loading;
};

// Warm the player runtime during idle so the first live room does not stall.
export const preloadHls = () => {
	if (typeof window === 'undefined') return;
	const warm = () => {
		void loadHls().catch(() => {});
	};
	if ('requestIdleCallback' in window) {
		(window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(
			warm,
			{ timeout: 4000 }
		);
		return;
	}
	setTimeout(warm, 1200);
};
