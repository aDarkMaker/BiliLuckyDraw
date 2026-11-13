import { useRef, useState } from 'react';

interface Tilt {
	x: number;
	y: number;
}

interface Glow {
	x: number;
	y: number;
	on: boolean;
}

const MAX_TILT = 8;

export const useTilt = (enabled: boolean) => {
	const cardRef = useRef<HTMLDivElement>(null);
	const [tilt, setTilt] = useState<Tilt>({ x: 0, y: 0 });
	const [glow, setGlow] = useState<Glow>({ x: 0, y: 0, on: false });

	const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
		if (!enabled) return;
		const node = cardRef.current;
		if (!node) return;
		const rect = node.getBoundingClientRect();
		const px = (event.clientX - rect.left) / rect.width;
		const py = (event.clientY - rect.top) / rect.height;
		setTilt({ x: (py - 0.5) * -MAX_TILT, y: (px - 0.5) * MAX_TILT });
		setGlow({ x: event.clientX - rect.left, y: event.clientY - rect.top, on: true });
	};

	const onLeave = () => {
		setTilt({ x: 0, y: 0 });
		setGlow((prev) => ({ ...prev, on: false }));
	};

	return { cardRef, tilt, glow, onMove, onLeave };
};

export default useTilt;
