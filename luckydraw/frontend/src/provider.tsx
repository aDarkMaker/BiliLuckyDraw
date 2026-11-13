import React from 'react';
import { HeroUIProvider } from '@heroui/react';

import { I18nProvider } from '@/i18n';
import { ThemeProvider } from '@/theme';

export const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<HeroUIProvider>
		<I18nProvider>
			<ThemeProvider>{children}</ThemeProvider>
		</I18nProvider>
	</HeroUIProvider>
);
