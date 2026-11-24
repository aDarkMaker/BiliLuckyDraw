import React, { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { useTheme } from '@/theme';

interface Layer {
	key: number;
	src: string;
	ready: boolean;
}

const FADE_MS = 320;

export const Backdrop: React.FC = () => {
	const { background, backgroundThumb, isDark } = useTheme();
	const [layers, setLayers] = useState<Layer[]>(() => (background ? [{ key: 0, src: background, ready: false }] : []));
	const nextKey = useRef(1);

	useEffect(() => {
		if (!background) {
			setLayers((prev) => (prev.length ? [] : prev));
			return;
		}
		setLayers((prev) => {
			const top = prev[prev.length - 1];
			if (top?.src === background) return prev;
			const visible = [...prev].reverse().find((layer) => layer.ready);
			if (visible?.src === background) return [visible];
			return [...(visible ? [visible] : []), { key: nextKey.current++, src: background, ready: false }];
		});
	}, [background]);

	const markReady = useCallback((key: number) => {
		setLayers((prev) => {
			const target = prev.find((layer) => layer.key === key);
			if (!target || target.ready) return prev;
			return prev.map((layer) => (layer.key === key ? { ...layer, ready: true } : layer));
		});
	}, []);

	useEffect(() => {
		const top = layers[layers.length - 1];
		if (layers.length < 2 || !top?.ready) return;
		const timer = setTimeout(() => {
			setLayers((prev) => (prev.length > 1 && prev[prev.length - 1].key === top.key ? [prev[prev.length - 1]] : prev));
		}, FADE_MS);
		return () => clearTimeout(timer);
	}, [layers]);

	const topSrc = layers.length ? layers[layers.length - 1].src : '';
	const thumb = backgroundThumb && backgroundThumb !== topSrc ? backgroundThumb : null;

	return (
		<div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-background">
			{background ? (
				<>
					{thumb && (
						<img
							alt=""
							className="absolute inset-0 h-full w-full scale-105 object-cover blur-md"
							decoding="async"
							draggable={false}
							fetchPriority="high"
							src={thumb}
						/>
					)}
					{layers.map((layer) => (
						<img
							key={layer.key}
							alt=""
							className={clsx(
								'absolute inset-0 h-full w-full scale-105 object-cover blur-[2px] transition-opacity duration-300',
								layer.ready ? 'opacity-100' : 'opacity-0'
							)}
							decoding="async"
							draggable={false}
							fetchPriority="high"
							src={layer.src}
							ref={(el) => {
								if (el?.complete && el.naturalWidth > 0) markReady(layer.key);
							}}
							onLoad={() => markReady(layer.key)}
						/>
					))}
					<div className="absolute inset-0 bg-[hsl(var(--backdrop-tint)/var(--backdrop-alpha))]" />
					<div
						className={
							isDark
								? 'absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_25%,hsl(0_0%_0%/0.55)_100%)]'
								: 'absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_30%,hsl(0_0%_100%/0.5)_100%)]'
						}
					/>
				</>
			) : (
				<div className="absolute inset-0 bg-background">
					<div className="absolute left-[-14%] top-[-20%] h-[46rem] w-[46rem] rounded-full bg-primary/25 blur-[150px]" />
					<div className="absolute right-[-16%] top-[4%] h-[34rem] w-[34rem] rounded-full bg-secondary/20 blur-[140px]" />
					<div className="absolute bottom-[-24%] left-[24%] h-[42rem] w-[42rem] rounded-full bg-primary/15 blur-[160px]" />
				</div>
			)}
		</div>
	);
};

export default Backdrop;
