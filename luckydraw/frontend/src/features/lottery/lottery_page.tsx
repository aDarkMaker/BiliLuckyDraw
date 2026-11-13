import React, { useCallback, useMemo, useState } from 'react';

import { useApp } from '@/contexts/app';
import { AccountCard } from '@/features/lottery/components/account_card';
import { ActionPanel } from '@/features/lottery/components/action_panel';
import { ControlBar } from '@/features/lottery/components/control_bar';
import { Stat } from '@/features/lottery/components/stat';
import { WinnersPanel } from '@/features/lottery/components/winners_panel';
import { DanmakuPanel } from '@/features/rooms/components/danmaku_panel';
import { RoomList } from '@/features/rooms/components/room_list';
import { RoomStage } from '@/features/rooms/components/room_stage';
import { useRoomInfo } from '@/features/rooms/useRoomInfo';
import { useI18n } from '@/i18n';
import { clipboardApi } from '@/services/api';
import type { RoomInfo } from '@/types';

const emptyStageRoom = (roomID: number): RoomInfo => ({
	room_id: roomID,
	title: '',
	cover: '',
	keyframe: '',
	live_status: 0,
	online: 0,
	attention: 0,
	area_name: '',
	parent_area_name: '',
	tags: '',
	anchor: { uid: 0, name: '', face: '' },
});

export const LotteryPage: React.FC = () => {
	const { t } = useI18n();
	const app = useApp();
	const { rooms } = useRoomInfo(app.watchedRooms, app.loggedIn);

	const [pinnedRoomID, setPinnedRoomID] = useState<number | null>(null);
	const stageRoomID =
		pinnedRoomID && app.watchedRooms.includes(pinnedRoomID) ? pinnedRoomID : (app.watchedRooms[0] ?? null);
	const stageRoom = useMemo(
		() => (stageRoomID ? rooms[stageRoomID] ?? emptyStageRoom(stageRoomID) : null),
		[rooms, stageRoomID]
	);

	const selectRoom = useCallback((roomID: number) => setPinnedRoomID(roomID), []);

	const handleCopy = async () => {
		const text = app.winners.map((w, i) => `${i + 1}. ${w.username} (UID: ${w.uid})`).join('\n');
		try {
			await clipboardApi.copy(text);
			app.notify(t('winner.copied'));
		} catch {
			app.notify(t('winner.copyFailed'));
		}
	};

	const stats = [
		{ label: t('lottery.stats.rooms'), value: app.watchedRooms.length, highlight: true },
		{ label: t('lottery.stats.participants'), value: app.participantCount },
		{ label: t('lottery.stats.winners'), value: app.winnerCount },
		{ label: t('lottery.stats.profiles'), value: app.profiles.length },
		{ label: t('lottery.stats.drawn'), value: app.winners.length, highlight: true },
	];

	return (
		<div className="mx-auto flex w-full max-w-[72rem] flex-col gap-3 pb-1 lg:h-full">
			<div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_19rem]">
				<div className="flex min-h-0 flex-col gap-3">
					<RoomStage room={stageRoom} />
					<ControlBar
						connecting={app.connecting}
						keyword={app.keyword}
						running={app.running}
						showResults={app.showResults}
						winnerCount={app.winnerCount}
						onKeywordChange={app.setKeyword}
						onReset={app.reset}
						onToggle={app.toggle}
						onWinnerCountChange={app.setWinnerCount}
					/>
					{app.showResults ? (
						<WinnersPanel winners={app.winners} onCopy={handleCopy} />
					) : (
						<ActionPanel connecting={app.connecting} keyword={app.keyword} participantCount={app.participantCount} running={app.running} />
					)}
				</div>

				<div className="flex min-h-0 flex-1 flex-col gap-3">
					<AccountCard account={app.account} emptyLabel={t('settings.account.placeholder')} loggedIn={app.loggedIn} />
					<RoomList
						activeRoomID={stageRoomID}
						roomIDs={app.watchedRooms}
						rooms={rooms}
						onSelect={selectRoom}
					/>
					<DanmakuPanel enabled={app.loggedIn} roomID={stageRoomID} />
				</div>
			</div>

			<div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
				{stats.map((item) => (
					<Stat key={item.label} highlight={item.highlight} label={item.label} value={item.value} />
				))}
			</div>
		</div>
	);
};

export default LotteryPage;
