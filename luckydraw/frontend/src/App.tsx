import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { Toaster } from '@/components/toaster';
import { AppProvider, useApp } from '@/contexts/app';
import { DefaultLayout } from '@/layouts/default';
import { LotteryPage } from '@/features/lottery/lottery_page';
import { LoginPage } from '@/features/session/login_page';
import { SettingsPage } from '@/features/settings/settings_page';

const Shell: React.FC = () => {
	const { loggedIn, checking } = useApp();

	if (checking) return null;
	if (!loggedIn) return <LoginPage />;

	return (
		<DefaultLayout>
			<Routes>
				<Route element={<LotteryPage />} path="/" />
				<Route element={<SettingsPage />} path="/settings" />
				<Route element={<Navigate replace to="/" />} path="*" />
			</Routes>
		</DefaultLayout>
	);
};

export const App: React.FC = () => (
	<AppProvider>
		<Toaster />
		<Shell />
	</AppProvider>
);

export default App;
