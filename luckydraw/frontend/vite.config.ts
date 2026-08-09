import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Wails dev proxy dials 127.0.0.1 (IPv4), but Vite defaults to IPv6 ::1.
// Bind IPv4 so the Wails proxy and browser both reach the dev server.
export default defineConfig({
	plugins: [react()],
	server: {
		host: '0.0.0.0',
		strictPort: true,
	},
});
