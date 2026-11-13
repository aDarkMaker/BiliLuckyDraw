import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Wails dev proxy dials 127.0.0.1 (IPv4), but Vite defaults to IPv6 ::1.
// Bind IPv4 so the Wails proxy and browser both reach the dev server.
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	server: {
		host: '0.0.0.0',
		strictPort: true,
		proxy: {
			'/wails': {
				target: 'http://127.0.0.1:9246',
				changeOrigin: true,
			},
			'/api': {
				target: 'http://127.0.0.1:9246',
				changeOrigin: true,
			},
		},
	},
});
