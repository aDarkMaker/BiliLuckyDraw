import React from 'react';

import { iconPaths, type IconName } from '@/generated/icons';

export type { IconName };

interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name'> {
	name: IconName;
	size?: number | string;
	decorative?: boolean;
}

export const Icon: React.FC<IconProps> = ({ name, size = 18, decorative = true, className, ...rest }) => (
	<svg
		{...rest}
		aria-hidden={decorative || undefined}
		className={className}
		fill="currentColor"
		height={size}
		viewBox="0 0 24 24"
		width={size}
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d={iconPaths[name]} fill="currentColor" />
	</svg>
);

export default Icon;
