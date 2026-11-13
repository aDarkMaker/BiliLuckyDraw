import React, { useState } from 'react';
import { Input, Spinner } from '@heroui/react';
import clsx from 'clsx';

import Icon from '@/components/icon';
import { fieldClassNames } from '@/components/field';
import { IconButton, PrimaryButton, Row } from '@/components/ui';
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
		<Section description={t('settings.rooms.hint')} icon={<Icon name="live-tv" size={16} />} title={t('settings.rooms.title')}>
			<div className="flex flex-col gap-3">
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

				<div className="flex flex-col gap-1">
					{watchedRooms.map((roomID) => {
						const room = rooms[roomID];
						const live = room?.live_status === 1;
						const upName = room?.anchor.name || '';
						return (
							<Row key={roomID} className="group h-auto min-h-11 bg-default-500/[0.05] py-1.5 dark:bg-white/[0.045]">
								<span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', live ? 'bg-success' : 'bg-default-300 dark:bg-default-500')} />
								<div className="min-w-0 flex-1">
									<div className="font-a61 truncate text-[12.5px] font-medium text-foreground">{upName || t('lottery.room.unknownAnchor')}</div>
									<div className="font-mono text-[10.5px] tabular-nums text-default-400">{roomID}</div>
								</div>
								<IconButton
									className="ml-auto opacity-0 group-hover:opacity-100"
									label={t('settings.rooms.remove')}
									tone="danger"
									onClick={() => drop(roomID)}
								>
									<Icon name="delete" size={14} />
								</IconButton>
							</Row>
						);
					})}
					{watchedRooms.length === 0 && <p className="py-2 text-center text-[12px] text-default-400">{t('settings.rooms.empty')}</p>}
				</div>
			</div>
		</Section>
	);
};

export default RoomsSection;
