import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { Provider } from './provider';
import { probeHTTPBridge } from './services/http';
import { preloadHls } from './features/rooms/hls';
import './styles/globals.css';

void probeHTTPBridge();
preloadHls();

createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<Provider>
			<BrowserRouter>
				<App />
			</BrowserRouter>
		</Provider>
	</React.StrictMode>
);
