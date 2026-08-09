import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './themes';
import { I18nProvider } from './i18n';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import './themes/spring-festival/variables.css';
import './themes/spring-festival/theme.css';
import './themes/dark/variables.css';
import './themes/beach/variables.css';
import './themes/beach/theme.css';

const container = document.getElementById('root');

const root = createRoot(container!);

root.render(
	<React.StrictMode>
		<I18nProvider>
			<ThemeProvider>
				<App />
			</ThemeProvider>
		</I18nProvider>
	</React.StrictMode>
);
