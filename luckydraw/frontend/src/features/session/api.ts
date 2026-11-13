import type { AccountInfo } from '@/types';
import { parseJSON } from '@/utils/json';
import { qrApi, sessionApi } from '@/services/qr';

export const authApi = {
	isLoggedIn: () => sessionApi.isLoggedIn(),
	account: async (): Promise<AccountInfo | null> => parseJSON<AccountInfo | null>(await sessionApi.account(), null),
	login: (cookie: string) => sessionApi.login(cookie),
	logout: () => sessionApi.logout(),
	qrCode: () => qrApi.code(),
	qrStatus: (key: string) => qrApi.status(key),
	loginWithQRCode: (cookie: string) => qrApi.login(cookie),
};
