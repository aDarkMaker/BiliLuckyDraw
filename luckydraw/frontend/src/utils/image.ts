const MAX_EDGE = 1920;
const MAX_BYTES = 640 * 1024;
const QUALITY_LADDER = [0.86, 0.78, 0.7, 0.62, 0.54, 0.46];
const EDGE_LADDER = [1920, 1600, 1280, 1024, 896, 768];

export interface PreparedBackground {
	dataUrl: string;
	blob: Blob;
}

const loadImage = (file: File): Promise<{ image: HTMLImageElement; release: () => void }> =>
	new Promise((resolve, reject) => {
		const objectUrl = URL.createObjectURL(file);
		const image = new Image();
		image.decoding = 'async';
		image.onload = () => resolve({ image, release: () => URL.revokeObjectURL(objectUrl) });
		image.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error('image decode failed'));
		};
		image.src = objectUrl;
	});

const draw = (image: HTMLImageElement, edge: number): HTMLCanvasElement => {
	const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
	const width = Math.max(1, Math.round(image.naturalWidth * scale));
	const height = Math.max(1, Math.round(image.naturalHeight * scale));
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('canvas unavailable');
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(image, 0, 0, width, height);
	return canvas;
};

const toBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> =>
	new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

const readDataUrl = (blob: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result || ''));
		reader.onerror = () => reject(reader.error ?? new Error('encode failed'));
		reader.readAsDataURL(blob);
	});

/** Encodes under a byte budget so the payload survives the Wails IPC bridge. */
export const prepareBackground = async (file: File, budget: number = MAX_BYTES): Promise<PreparedBackground> => {
	if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name)) {
		throw new Error('unsupported image');
	}

	const { image, release } = await loadImage(file);
	try {
		// Prefer the original file when it already fits — avoids a canvas round-trip
		// that can muddy flat / anime colors before the backend even sees it.
		if (file.size <= budget && /^image\/(jpeg|png|webp)$/i.test(file.type || '')) {
			return { blob: file, dataUrl: await readDataUrl(file) };
		}

		const cap = Math.min(MAX_EDGE, Math.max(image.naturalWidth, image.naturalHeight));
		const edges = EDGE_LADDER.filter((edge) => edge <= cap);
		if (edges.length === 0) edges.push(cap);

		let smallest: Blob | null = null;
		for (const edge of edges) {
			const canvas = draw(image, edge);
			for (const quality of QUALITY_LADDER) {
				const blob = await toBlob(canvas, quality);
				if (!blob) continue;
				if (!smallest || blob.size < smallest.size) smallest = blob;
				if (blob.size <= budget) {
					return { blob, dataUrl: await readDataUrl(blob) };
				}
			}
		}

		if (!smallest) throw new Error('encode failed');
		return { blob: smallest, dataUrl: await readDataUrl(smallest) };
	} finally {
		release();
	}
};
