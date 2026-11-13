import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';

import { useLottery } from '@/features/lottery/useLottery';
import { useProfiles } from '@/features/profiles/useProfiles';
import { useSession } from '@/features/session/useSession';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import { errorMessage } from '@/utils/json';

type AppValue = ReturnType<typeof useSession> &
	ReturnType<typeof useProfiles> &
	ReturnType<typeof useLottery> & {
		notify: (message: string) => void;
		logout: () => Promise<void>;
	};

const AppContext = createContext<AppValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { t } = useI18n();
	const { setCustomImage } = useTheme();
	const session = useSession();
	const profiles = useProfiles(session.loggedIn);

	useEffect(() => {
		setCustomImage(profiles.backgroundImage || '');
	}, [profiles.backgroundImage, setCustomImage]);

	const notify = useCallback((message: string) => {
		if (message) toast(message);
	}, []);

	const lottery = useLottery({
		watchedRooms: profiles.watchedRooms,
		keyword: profiles.keyword,
		winnerCount: profiles.winnerCount,
		enabled: session.loggedIn,
		notify,
	});

	const logout = useCallback(async () => {
		try {
			await session.signOut();
			notify(t('app.toast.loggedOut'));
		} catch (error) {
			notify(t('app.toast.logoutFailed', { error: errorMessage(error) }));
		}
	}, [notify, session, t]);

	const value = useMemo<AppValue>(
		() => ({ ...session, ...profiles, ...lottery, notify, logout }),
		[session, profiles, lottery, notify, logout]
	);

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppValue => {
	const ctx = useContext(AppContext);
	if (!ctx) throw new Error('useApp must be used within AppProvider');
	return ctx;
};
