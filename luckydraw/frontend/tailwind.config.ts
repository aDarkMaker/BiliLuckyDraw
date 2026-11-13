import type { Config } from 'tailwindcss';
import { heroui } from '@heroui/react';

export default {
	content: [
		'./index.html',
		'./src/**/*.{js,ts,jsx,tsx}',
		'./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ['AaCute', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
				mono: ['JetBrains Mono', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'ui-monospace', 'monospace'],
			},
		},
	},
	darkMode: 'class',
	plugins: [heroui({ defaultTheme: 'dark' })],
} satisfies Config;
