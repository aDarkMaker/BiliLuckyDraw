import { AppService } from '../../bindings/luckydraw/internal/app';
import { parseJSON } from '@/utils/json';
import { callHTTP, fallback } from '@/services/http';

export interface QRCodeInfo {
	url: string;
	qrcode_key: string;
}

export interface QRStatus {
	code: number;
	message?: string;
	data: { code: number };
	cookie?: string;
}

const emptyQRCode: QRCodeInfo = { url: '', qrcode_key: '' };
const emptyStatus: QRStatus = { code: -1, data: { code: -1 } };

interface SessionPayload {
	logged_in: boolean;
	account?: unknown;
}

export const qrApi = {
	code: (): Promise<QRCodeInfo> =>
		fallback(
			async () => parseJSON<QRCodeInfo>(await AppService.GetQRCode(), emptyQRCode),
			() => callHTTP<QRCodeInfo>('/api/qr')
		),

	status: (key: string): Promise<QRStatus> =>
		fallback(
			async () => parseJSON<QRStatus>(await AppService.CheckQRCodeStatus(key), emptyStatus),
			() => callHTTP<QRStatus>(`/api/qr/status?key=${encodeURIComponent(key)}`)
		),

	login: (cookie: string): Promise<string> =>
		fallback(
			() => AppService.LoginWithQRCode(cookie),
			async () => {
				const result = await callHTTP<{ message: string }>('/api/login/qr', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ cookie }),
				});
				return result.message;
			}
		),
};

export const sessionApi = {
	isLoggedIn: (): Promise<boolean> =>
		fallback(
			() => AppService.IsLoggedIn(),
			async () => (await callHTTP<SessionPayload>('/api/session')).logged_in
		),

	account: (): Promise<string> =>
		fallback(
			() => AppService.GetAccountInfo(),
			async () => {
				const session = await callHTTP<SessionPayload>('/api/session');
				return JSON.stringify(session.account ?? null);
			}
		),

	login: (cookie: string): Promise<string> =>
		fallback(
			() => AppService.Login(cookie),
			async () => {
				const result = await callHTTP<{ message: string }>('/api/login', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ cookie }),
				});
				return result.message;
			}
		),

	logout: (): Promise<void> =>
		fallback(
			() => AppService.Logout(),
			async () => {
				await callHTTP('/api/logout', { method: 'POST' });
			}
		),
};
