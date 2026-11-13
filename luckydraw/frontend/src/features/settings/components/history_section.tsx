import React, { useState } from 'react';
import { Spinner } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';

import Icon from '@/components/icon';
import { Section } from '@/features/settings/components/section';
import { HistoryRecordItem } from '@/features/history/components/history_record';
import { useHistory } from '@/features/history/useHistory';
import { useApp } from '@/contexts/app';
import { useI18n } from '@/i18n';
import { errorMessage } from '@/utils/json';

export const HistorySection: React.FC = () => {
	const { t } = useI18n();
	const { activeProfileId, notify } = useApp();
	const { records, loading, remove, clear, exportRecord } = useHistory(activeProfileId);
	const [expandedId, setExpandedId] = useState('');
	const [confirming, setConfirming] = useState(false);

	const onRemove = async (id: string) => {
		try {
			if (expandedId === id) setExpandedId('');
			await remove(id);
			notify(t('settings.toast.historyDeleted'));
		} catch (error) {
			notify(t('settings.toast.historyDeleteFailed', { error: errorMessage(error) }));
		}
	};

	const onClear = async () => {
		try {
			setExpandedId('');
			await clear();
			notify(t('settings.toast.historyAllDeleted'));
		} catch (error) {
			notify(t('settings.toast.historyDeleteFailed', { error: errorMessage(error) }));
		}
	};

	const onExport = async (id: string) => {
		try {
			const path = await exportRecord(id);
			if (path) notify(t('settings.toast.historyExported', { path }));
		} catch (error) {
			notify(t('settings.toast.historyExportFailed', { error: errorMessage(error) }));
		}
	};

	const ordered = [...records].reverse();

	return (
		<Section
			icon={<Icon name="history" size={16} />}
			title={t('settings.history.title')}
			action={
				records.length > 0 && (
					<button
						aria-label={t('settings.history.deleteAll')}
						className="flex h-8 items-center gap-1 rounded-full px-2 text-[11.5px] font-medium text-default-400 transition-colors hover:bg-danger/10 hover:text-danger"
						type="button"
						onClick={() => setConfirming(true)}
					>
						<Icon name="delete" size={13} />
						{t('settings.history.deleteAll')}
					</button>
				)
			}
		>
			<div className="flex flex-col gap-1.5">
				{loading && (
					<div className="flex justify-center py-4">
						<Spinner size="sm" />
					</div>
				)}

				{ordered.map((record) => {
					const open = expandedId === record.id;
					return (
						<HistoryRecordItem
							key={record.id}
							open={open}
							record={record}
							onExport={() => onExport(record.id)}
							onRemove={() => onRemove(record.id)}
							onToggle={() => setExpandedId(open ? '' : record.id)}
						/>
					);
				})}

				{!loading && records.length === 0 && (
					<div className="flex flex-col items-center gap-1.5 py-6">
						<Icon className="text-default-300 dark:text-default-500" name="refresh" size={22} />
						<p className="text-[11.5px] text-default-400">{t('settings.history.empty')}</p>
					</div>
				)}
			</div>

			<AnimatePresence>
				{confirming && (
					<motion.div
						animate={{ opacity: 1 }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						onClick={() => setConfirming(false)}
					>
						<motion.div
							animate={{ opacity: 1, scale: 1 }}
							className="surface w-full max-w-sm rounded-large p-5"
							exit={{ opacity: 0, scale: 0.96 }}
							initial={{ opacity: 0, scale: 0.96 }}
							onClick={(e) => e.stopPropagation()}
						>
							<h3 className="text-[14px] font-semibold text-foreground">{t('settings.history.confirmDeleteAllTitle')}</h3>
							<p className="mt-1.5 text-[12px] leading-relaxed text-default-500">{t('settings.history.confirmDeleteAll')}</p>
							<div className="mt-4 flex gap-2">
								<button
									className="h-9 flex-1 rounded-full border border-default-200/70 text-[12.5px] text-default-600 transition-colors hover:bg-default-500/10 dark:border-white/10 dark:text-default-400"
									type="button"
									onClick={() => setConfirming(false)}
								>
									{t('common.cancel')}
								</button>
								<button
									className="h-9 flex-1 rounded-full bg-danger text-[12.5px] font-medium text-danger-foreground transition-opacity hover:opacity-90"
									type="button"
									onClick={() => {
										setConfirming(false);
										onClear();
									}}
								>
									{t('settings.history.deleteAll')}
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</Section>
	);
};

export default HistorySection;
