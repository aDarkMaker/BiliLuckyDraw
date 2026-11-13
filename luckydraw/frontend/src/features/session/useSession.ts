import { useCallback, useEffect, useState } from 'react';

import { authApi } from '@/services/api';
import type { AccountInfo } from '@/types';

export const useSession = () => {
	const [loggedIn, setLoggedIn] = useState(false);
	const [account, setAccount] = useState<AccountInfo | null>(null);
	const [checking, setChecking] = useState(true);

	const refreshAccount = useCallback(async () => {
		const info = await authApi.account().catch(() => null);
		if (info) setAccount(info);
	}, []);

	const loadSession = useCallback(async () => {
		const ok = await authApi.isLoggedIn().catch(() => false);
		setLoggedIn(ok);
		if (ok) await refreshAccount();
	}, [refreshAccount]);

	useEffect(() => {
		loadSession().finally(() => setChecking(false));
	}, [loadSession]);

	const signIn = useCallback(
		async (cookie: string) => {
			const message = await authApi.login(cookie);
			setLoggedIn(true);
			await refreshAccount();
			return message;
		},
		[refreshAccount]
	);

	const signInWithQRCode = useCallback(
		async (cookie: string) => {
			const message = await authApi.loginWithQRCode(cookie);
			setLoggedIn(true);
			await refreshAccount();
			return message;
		},
		[refreshAccount]
	);

	const signOut = useCallback(async () => {
		await authApi.logout();
		setLoggedIn(false);
		setAccount(null);
	}, []);

	return { loggedIn, account, checking, signIn, signInWithQRCode, signOut };
};
