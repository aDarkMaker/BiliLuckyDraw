import React from 'react';
import clsx from 'clsx';

interface LogoProps {
	size?: number;
	className?: string;
}

/** Project mark, cropped to the artwork's own bounding box. */
export const Logo: React.FC<LogoProps> = ({ size = 32, className }) => (
	<img
		alt="BiliLuckyDraw"
		className={clsx('select-none object-contain', className)}
		decoding="async"
		draggable={false}
		height={size}
		src="/favicon.png"
		style={{ height: size, width: size }}
		width={size}
	/>
);

export default Logo;
