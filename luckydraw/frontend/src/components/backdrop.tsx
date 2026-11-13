import React from 'react';

import { useTheme } from '@/theme';

/**
 * Ambient backdrop: preset/custom photo with a tone-matched scrim, or the default
 * layered gradient. Lives at z-0 behind the shell content (z-10).
 */
export const Backdrop: React.FC = () => {
	const { background, isDark } = useTheme();

	return (
		<div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-background">
			{background ? (
				<>
					<img
						alt=""
						className="h-full w-full scale-105 object-cover blur-[2px]"
						decoding="async"
						draggable={false}
						fetchPriority="high"
						src={background}
					/>
					{/* tone-matched scrim: keeps the photo's hue instead of washing it to flat grey */}
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
