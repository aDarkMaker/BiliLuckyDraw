import React, { useState } from 'react';
import { Input, Spinner } from '@heroui/react';
import clsx from 'clsx';

import Icon from '@/components/icon';
import { fieldClassNames } from '@/components/field';
import { IconButton, PrimaryButton } from '@/components/ui';
import { Section } from '@/features/settings/components/section';
import { useApp } from '@/contexts/app';
import { useI18n } from '@/i18n';
import { useRoomInfo } from '@/features/rooms/useRoomInfo';
import { errorMessage } from '@/utils/json';
import { parseRoomId } from '@/utils/parseRoomId';

export const RoomsSection: React.FC = () => {
	const { t } = useI18n();
	const { watchedRooms, addRoom, removeRoom, notify } = useApp();
	const { rooms } = useRoomInfo(watchedRooms, watchedRooms.length > 0);
	const [roomInput, setRoomInput] = useState('');
	const [pending, setPending] = useState(false);

	const submit = async () => {
		const roomID = parseRoomId(roomInput);
		if (roomID === null) {
			notify(t('settings.toast.invalidRoomId'));
			return;
		}
		if (watchedRooms.includes(roomID)) {
			setRoomInput('');
			return;
		}
		setPending(true);
		try {
			await addRoom(roomID);
			setRoomInput('');
			notify(t('settings.toast.roomAdded', { id: roomID }));
		} catch (error) {
			notify(t('settings.toast.roomAddFailed', { error: errorMessage(error) }));
		} finally {
			setPending(false);
		}
	};

	const drop = async (roomID: number) => {
		try {
			await removeRoom(roomID);
			notify(t('settings.toast.roomRemoved', { id: roomID }));
		} catch (error) {
			notify(t('settings.toast.roomRemoveFailed', { error: errorMessage(error) }));
		}
	};

	return (
		<Section icon={<Icon name="live-tv" size={16} />} title={t('settings.rooms.title')}>
			<div className="flex flex-col gap-2.5">
				<div className="flex gap-2">
					<Input
						className="flex-1"
						classNames={fieldClassNames}
						placeholder={t('settings.rooms.idPlaceholder')}
						radius="md"
						value={roomInput}
						onKeyDown={(e) => {
							if (e.key === 'Enter') submit();
						}}
						onValueChange={setRoomInput}
					/>
					<PrimaryButton aria-label={t('settings.rooms.add')} className="h-11 w-11" disabled={pending} onClick={submit}>
						{pending ? <Spinner color="current" size="sm" /> : <Icon name="add" size={18} />}
					</PrimaryButton>
				</div>

				<div className="flex flex-col gap-1.5">
					{watchedRooms.map((roomID) => {
						const room = rooms[roomID];
						const live = room?.live_status === 1;
						return (
							<div
								key={roomID}
								className="group flex min-h-11 items-center gap-2.5 rounded-medium border border-default-200/50 bg-default-500/[0.04] px-2.5 py-2 transition-colors hover:border-primary/25 dark:border-white/10 dark:bg-white/[0.035]"
							>
								<span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', live ? 'bg-success' : 'bg-default-300 dark:bg-default-500')} />
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									{room ? (
										<div className="font-a61 truncate text-[12.5px] font-medium text-foreground">
											{room.anchor.name || t('lottery.room.unknownAnchor')}
										</div>
									) : (
										<span aria-hidden className="block h-3 w-24 animate-pulse rounded-full bg-default-500/20" />
									)}
									<div className="font-mono text-[10.5px] tabular-nums text-default-400">{roomID}</div>
								</div>
								<IconButton
									className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
									label={t('settings.rooms.remove')}
									tone="danger"
									onClick={() => drop(roomID)}
								>
									<Icon name="delete" size={14} />
								</IconButton>
							</div>
						);
					})}
					{watchedRooms.length === 0 && <p className="py-2 text-center text-[12px] text-default-400">{t('settings.rooms.empty')}</p>}
				</div>
			</div>
		</Section>
	);
};

export default RoomsSection;
