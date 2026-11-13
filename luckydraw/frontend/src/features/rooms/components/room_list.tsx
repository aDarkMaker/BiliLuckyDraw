import React, { memo } from 'react';
import clsx from 'clsx';

import Icon from '@/components/icon';
import { CachedImage } from '@/components/image';
import { Panel, PanelBody, PanelHeader } from '@/components/panel';
import { useQuietScroll } from '@/components/scroll';
import { useI18n } from '@/i18n';
import type { RoomInfo } from '@/types';

interface RoomListProps {
	roomIDs: number[];
	rooms: Record<number, RoomInfo>;
	activeRoomID: number | null;
	onSelect: (roomID: number) => void;
}

export const RoomList: React.FC<RoomListProps> = memo(({ roomIDs, rooms, activeRoomID, onSelect }) => {
	const { t } = useI18n();
	const listRef = useQuietScroll<HTMLDivElement>();

	return (
		<Panel className="flex max-h-[min(42%,20rem)] min-h-0 shrink flex-col overflow-hidden">
			<PanelHeader
				icon={<Icon name="live-tv" size={16} />}
				title={t('lottery.rooms.title')}
				extra={<span className="font-mono text-[11px] tabular-nums text-default-400">{roomIDs.length}</span>}
			/>
			<PanelBody ref={listRef} className="scroll-quiet flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto !pb-2.5 !pt-2.5">
				{roomIDs.length === 0 && <p className="py-3 text-center text-[12px] text-default-400">{t('settings.rooms.empty')}</p>}
				{roomIDs.map((roomID) => {
					const room = rooms[roomID];
					const live = room?.live_status === 1;
					const cover = room?.cover || room?.keyframe || '';
					const active = roomID === activeRoomID;

					return (
						<button
							key={roomID}
							className={clsx(
								'flex items-center gap-2.5 rounded-medium p-1.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40',
								active ? 'bg-primary/10' : 'hover:bg-default-500/10'
							)}
							type="button"
							onClick={() => onSelect(roomID)}
						>
							<div className="relative h-9 w-16 shrink-0 overflow-hidden rounded-small bg-default-500/10">
								{cover ? (
									<CachedImage alt="" className="h-full w-full object-cover" src={cover} wide={64} />
								) : (
									<div className="flex h-full w-full items-center justify-center text-default-400">
										<Icon name="live-tv" size={14} />
									</div>
								)}
								{live && <span className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_2px_rgba(0,0,0,0.35)]" />}
							</div>
							<div className="min-w-0 flex-1">
								<div className={clsx('font-a61 truncate text-[12px] font-medium', active ? 'text-primary' : 'text-foreground')}>
									{room?.title || t('lottery.room.fallback', { id: roomID })}
								</div>
								<div className="font-a61 truncate text-[10.5px] text-default-400">
									{room?.anchor.name || roomID}
								</div>
							</div>
						</button>
					);
				})}
			</PanelBody>
		</Panel>
	);
});

export default RoomList;
