import { useCallback, useEffect, useState } from 'react';

import { historyApi } from '@/features/settings/api';
import type { HistoryRecord } from '@/types';

export const useHistory = (profileID: string) => {
	const [records, setRecords] = useState<HistoryRecord[]>([]);
	const [loading, setLoading] = useState(false);

	const load = useCallback(async () => {
		if (!profileID) return;
		setLoading(true);
		try {
			setRecords(await historyApi.list(profileID));
		} catch {
			setRecords([]);
		} finally {
			setLoading(false);
		}
	}, [profileID]);

	useEffect(() => {
		void load();
	}, [load]);

	const remove = useCallback(
		async (id: string) => {
			await historyApi.remove(profileID, id);
			await load();
		},
		[profileID, load]
	);

	const clear = useCallback(async () => {
		await historyApi.clear(profileID);
		await load();
	}, [profileID, load]);

	const exportRecord = useCallback(
		async (id: string) => historyApi.exportFile(profileID, id),
		[profileID]
	);

	return { records, loading, remove, clear, exportRecord };
};
