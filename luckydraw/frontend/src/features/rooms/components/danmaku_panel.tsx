import React, { memo, useEffect, useRef } from 'react';
import clsx from 'clsx';

import { CachedImage } from '@/components/image';
import Icon from '@/components/icon';
import { Panel, PanelBody, PanelHeader } from '@/components/panel';
import { useI18n } from '@/i18n';
import type { DanmakuLine } from '@/types';
import { renderEmoteText } from '@/features/rooms/emote';
import { useDanmakuFeed } from '@/features/rooms/useDanmakuFeed';

const STICK_IDLE_MS = 3000;
const NEAR_BOTTOM_PX = 48;

interface DanmakuPanelProps {
	roomID: number | null;
	enabled: boolean;
}

const DanmakuRow = memo<{ line: DanmakuLine; emotes: Record<string, string> }>(({ line, emotes }) => {
	const system = line.kind === 'enter' || line.kind === 'follow';

	return (
		<div className="danmaku-row flex items-start gap-2">
			<div className="mt-0.5 h-6 w-6 shrink-0 overflow-hidden rounded-full bg-default-500/15 ring-1 ring-default-500/15">
				{line.face ? (
					<CachedImage alt="" className="h-full w-full object-cover" src={line.face} thumb={24} />
				) : (
					<div className="flex h-full w-full items-center justify-center text-default-400">
						<Icon name="person" size={14} />
					</div>
				)}
			</div>
			<div className="min-w-0 flex-1 font-a61 text-[12.5px] leading-[1.4]">
				<div className={clsx('truncate font-medium', system ? 'text-default-500' : 'text-primary')}>{line.username}</div>
				<div className={clsx('break-words', system ? 'text-default-400' : 'text-foreground')}>
					{renderEmoteText(line.message, emotes)}
				</div>
			</div>
		</div>
	);
});
DanmakuRow.displayName = 'DanmakuRow';

export const DanmakuPanel = memo<DanmakuPanelProps>(({ roomID, enabled }) => {
	const { t } = useI18n();
	// Owns the feed so incoming lines never re-render the surrounding page.
	const { lines, watching, emotes } = useDanmakuFeed(roomID, enabled);
	const scroller = useRef<HTMLDivElement>(null);
	const stick = useRef(true);
	const frame = useRef<number | null>(null);
	const idle = useRef<number | null>(null);
	const writing = useRef(false);

	const clearIdle = () => {
		if (idle.current === null) return;
		window.clearTimeout(idle.current);
		idle.current = null;
	};

	const scrollToBottom = () => {
		if (frame.current !== null) return;
		frame.current = window.requestAnimationFrame(() => {
			frame.current = null;
			const el = scroller.current;
			if (!el || !stick.current) return;
			writing.current = true;
			el.scrollTop = el.scrollHeight;
			window.requestAnimationFrame(() => {
				writing.current = false;
			});
		});
	};

	const armIdle = () => {
		clearIdle();
		idle.current = window.setTimeout(() => {
			idle.current = null;
			stick.current = true;
			scrollToBottom();
		}, STICK_IDLE_MS);
	};

	useEffect(() => {
		if (!stick.current) return;
		scrollToBottom();
	}, [lines]);

	useEffect(
		() => () => {
			if (frame.current !== null) window.cancelAnimationFrame(frame.current);
			clearIdle();
		},
		[]
	);

	return (
		<Panel className="flex min-h-[10rem] flex-1 flex-col overflow-hidden">
			<PanelHeader
				icon={<Icon name="chat" size={16} />}
				title={t('lottery.danmaku.title')}
				extra={
					<span className="font-a61 truncate text-[11px] text-default-400">
						{!roomID ? t('lottery.danmaku.noRoom') : watching ? t('lottery.danmaku.live') : t('lottery.danmaku.connecting')}
					</span>
				}
			/>
			<PanelBody className="flex min-h-0 flex-1 flex-col !p-0">
				<div
					ref={scroller}
					className="danmaku-feed min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2.5 pb-2 pt-3"
					onScroll={(event) => {
						if (writing.current) return;
						const el = event.currentTarget;
						const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
						stick.current = nearBottom;
						if (nearBottom) clearIdle();
						else armIdle();
					}}
				>
					{!roomID && <p className="py-6 text-center text-[12px] text-default-400">{t('lottery.danmaku.emptyRoom')}</p>}
					{roomID && lines.length === 0 && (
						<p className="py-6 text-center text-[12px] text-default-400">
							{watching ? t('lottery.danmaku.waiting') : t('lottery.danmaku.connecting')}
						</p>
					)}
					{lines.map((line) => (
						<DanmakuRow emotes={emotes} key={line.id} line={line} />
					))}
				</div>
			</PanelBody>
		</Panel>
	);
});

export default DanmakuPanel;
