import { AppService } from '../../../bindings/luckydraw/internal/app';
import type { HistoryRecord } from '@/types';
import { parseJSON } from '@/utils/json';
import { callHTTP, fallback } from '@/services/http';

export const historyApi = {
	list: async (profileID: string): Promise<HistoryRecord[]> =>
		parseJSON<HistoryRecord[]>(await AppService.GetHistory(profileID), []),
	remove: (profileID: string, historyID: string) => AppService.DeleteHistory(profileID, historyID),
	clear: (profileID: string) => AppService.DeleteAllHistory(profileID),
	exportFile: (profileID: string, historyID: string) => AppService.ExportHistory(profileID, historyID),
};

export const clipboardApi = {
	copy: async (text: string) => {
		// Browsers and the Wails webview expose this directly; only the plain dev
		// bridge needs a round trip to the Go side.
		if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
			try {
				await navigator.clipboard.writeText(text);
				return;
			} catch {
				// fall through to the backend path
			}
		}
		await fallback(
			() => AppService.CopyText(text),
			async () => {
				await callHTTP('/api/clipboard', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ text }),
				});
			}
		);
	},
};
