import React, { memo, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { CachedImage } from '@/components/image';
import Icon from '@/components/icon';
import { roomApi } from '@/services/api';
import { useI18n } from '@/i18n';
import type { RoomInfo } from '@/types';
import { loadHls, type HlsErrorData, type HlsInstance, type HlsModule } from '@/features/rooms/hls';

interface RoomStageProps {
	room: RoomInfo | null;
}

const formatCount = (value: number) => value.toLocaleString('en-US');

const STALL_COVER_MS = 8_000;
const WATCHDOG_MS = 1_500;
const WATCHDOG_STALL_MS = 5_000;
const MAX_FATAL_RECOVERIES = 3;
const REBUILD_BASE_MS = 1_500;
const REBUILD_MAX_MS = 20_000;

export const RoomStage: React.FC<RoomStageProps> = memo(({ room }) => {
	const { t } = useI18n();
	const videoRef = useRef<HTMLVideoElement>(null);
	const [playing, setPlaying] = useState(false);
	const live = room?.live_status === 1;
	const cover = room?.cover || room?.keyframe || '';

	useEffect(() => {
		const video = videoRef.current;
		if (!video || !live || !room?.room_id) {
			setPlaying(false);
			return;
		}

		const roomId = room.room_id;
		let cancelled = false;
		let hls: HlsInstance | null = null;
		let fatalFails = 0;
		let rebuildAttempt = 0;
		let stallTimer: ReturnType<typeof setTimeout> | null = null;
		let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
		let watchdog: ReturnType<typeof setInterval> | null = null;
		let lastTime = 0;
		let lastAdvance = Date.now();
		let softResumes = 0;
		let starting = false;

		const clearStallTimer = () => {
			if (!stallTimer) return;
			clearTimeout(stallTimer);
			stallTimer = null;
		};

		const clearRebuildTimer = () => {
			if (!rebuildTimer) return;
			clearTimeout(rebuildTimer);
			rebuildTimer = null;
		};

		const destroyPlayer = () => {
			stopWatchdog();
			if (hls) {
				hls.destroy();
				hls = null;
			}
			video.pause();
			video.removeAttribute('src');
			video.load();
		};

		const tryResume = () => {
			if (cancelled || !videoRef.current) return;
			void videoRef.current.play().catch(() => {});
		};

		// Silent stalls emit no media event at all: time simply stops advancing
		// while the element still reports "playing". Watch the clock directly.
		const startWatchdog = () => {
			if (watchdog) return;
			lastTime = video.currentTime;
			lastAdvance = Date.now();
			watchdog = setInterval(() => {
				if (cancelled) return;
				const now = video.currentTime;
				if (Math.abs(now - lastTime) > 0.01) {
					lastTime = now;
					lastAdvance = Date.now();
					return;
				}
				if (Date.now() - lastAdvance < WATCHDOG_STALL_MS) return;

				lastAdvance = Date.now();
				if (softResumes < 2) {
					softResumes += 1;
					setPlaying(false);
					tryResume();
					return;
				}

				softResumes = 0;
				scheduleRebuild();
			}, WATCHDOG_MS);
		};

		const stopWatchdog = () => {
			if (!watchdog) return;
			clearInterval(watchdog);
			watchdog = null;
		};

		const scheduleRebuild = () => {
			if (cancelled || rebuildTimer) return;
			setPlaying(false);
			const delay = Math.min(REBUILD_BASE_MS * 2 ** rebuildAttempt, REBUILD_MAX_MS);
			rebuildAttempt += 1;
			rebuildTimer = setTimeout(() => {
				rebuildTimer = null;
				void start(true);
			}, delay);
		};

		const onHlsError = (_event: string, data: HlsErrorData) => {
			if (cancelled || !data?.fatal || !hls) return;

			fatalFails += 1;
			const Hls = (window as unknown as { Hls?: HlsModule }).Hls;
			const network = Hls?.ErrorTypes?.NETWORK_ERROR;
			const media = Hls?.ErrorTypes?.MEDIA_ERROR;

			if (data.type === network && fatalFails <= MAX_FATAL_RECOVERIES) {
				hls.startLoad();
				tryResume();
				return;
			}
			if (data.type === media && fatalFails <= MAX_FATAL_RECOVERIES) {
				hls.recoverMediaError();
				tryResume();
				return;
			}

			scheduleRebuild();
		};

		const attachHls = async (url: string, Hls: HlsModule) => {
			const instance = new Hls({
				enableWorker: true,
				lowLatencyMode: true,
				maxBufferLength: 10,
				maxMaxBufferLength: 30,
				backBufferLength: 8,
				liveSyncDurationCount: 3,
				manifestLoadingMaxRetry: 4,
				levelLoadingMaxRetry: 4,
				fragLoadingMaxRetry: 4,
			});
			instance.loadSource(url);
			instance.attachMedia(video);
			instance.on(Hls.Events.ERROR, onHlsError);
			hls = instance;
		};

		const start = async (isRebuild = false) => {
			if (cancelled || starting) return;
			starting = true;
			clearRebuildTimer();
			clearStallTimer();

			if (isRebuild) destroyPlayer();

			try {
				const url = await roomApi.playUrl(roomId);
				if (cancelled || !videoRef.current) return;

				video.muted = true;
				fatalFails = 0;

				if (video.canPlayType('application/vnd.apple.mpegurl')) {
					video.src = url;
				} else {
					const Hls = await loadHls();
					if (cancelled || !videoRef.current) return;
					if (Hls.isSupported()) {
						await attachHls(url, Hls);
					} else {
						video.src = url;
					}
				}

				rebuildAttempt = 0;
				softResumes = 0;
				lastAdvance = Date.now();
				tryResume();
			} catch {
				if (!cancelled) {
					setPlaying(false);
					scheduleRebuild();
				}
			} finally {
				starting = false;
			}
		};

		const onPlaying = () => {
			clearStallTimer();
			softResumes = 0;
			startWatchdog();
			if (!cancelled) setPlaying(true);
		};

		const onWaiting = () => {
			clearStallTimer();
			stallTimer = setTimeout(() => {
				if (cancelled) return;
				setPlaying(false);
				tryResume();
			}, STALL_COVER_MS);
		};

		const onStalled = () => {
			onWaiting();
			tryResume();
		};

		const onPause = () => {
			if (cancelled) return;
			tryResume();
		};

		const onEnded = () => {
			if (cancelled) return;
			setPlaying(false);
			scheduleRebuild();
		};

		const onError = () => {
			if (cancelled) return;
			setPlaying(false);
			scheduleRebuild();
		};

		video.addEventListener('playing', onPlaying);
		video.addEventListener('waiting', onWaiting);
		video.addEventListener('stalled', onStalled);
		video.addEventListener('pause', onPause);
		video.addEventListener('ended', onEnded);
		video.addEventListener('error', onError);

		void start();

		return () => {
			cancelled = true;
			clearStallTimer();
			clearRebuildTimer();
			stopWatchdog();
			video.removeEventListener('playing', onPlaying);
			video.removeEventListener('waiting', onWaiting);
			video.removeEventListener('stalled', onStalled);
			video.removeEventListener('pause', onPause);
			video.removeEventListener('ended', onEnded);
			video.removeEventListener('error', onError);
			destroyPlayer();
			setPlaying(false);
		};
	}, [live, room?.room_id]);

	return (
		<div className="surface relative aspect-video w-full shrink-0 overflow-hidden rounded-large">
			{cover ? (
				<CachedImage
					alt=""
					className={clsx('absolute inset-0 h-full w-full object-cover transition-opacity', playing ? 'opacity-0' : 'opacity-100')}
					eager
					fade={false}
					src={cover}
					wide={720}
				/>
			) : (
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--heroui-primary)/0.28),transparent_62%),radial-gradient(circle_at_74%_72%,hsl(var(--heroui-secondary)/0.24),transparent_62%)]" />
			)}

			<video
				ref={videoRef}
				autoPlay
				muted
				playsInline
				className={clsx('absolute inset-0 h-full w-full object-cover transition-opacity', playing ? 'opacity-100' : 'opacity-0')}
			/>

			<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

			<div className="absolute inset-x-0 top-0 flex items-center gap-2 p-3">
				<span
					className={clsx(
						'flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium backdrop-blur-md',
						live ? 'bg-primary/90 text-primary-foreground' : 'bg-black/50 text-white/80'
					)}
				>
					<span className={clsx('h-1.5 w-1.5 rounded-full', live ? 'bg-white' : 'bg-white/50')} />
					{live ? t('lottery.room.live') : t('lottery.room.offline')}
				</span>
				{room && (
					<span className="flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 font-mono text-[11px] tabular-nums text-white/80 backdrop-blur-md">
						<Icon name="visibility" size={12} />
						{formatCount(room.online)}
					</span>
				)}
				{room?.room_id ? (
					<span className="ml-auto rounded-full bg-black/45 px-2 py-1 font-mono text-[11px] tabular-nums text-white/70 backdrop-blur-md">
						{room.room_id}
					</span>
				) : null}
			</div>

			<div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4">
				{room ? (
					<>
						<h2 className="font-a61 line-clamp-2 text-[15px] font-semibold leading-snug text-white drop-shadow-sm">
							{room.title || t('lottery.room.fallback', { id: room.room_id })}
						</h2>
						<div className="flex items-center gap-2">
							{room.anchor.face ? (
								<CachedImage
									alt={room.anchor.name}
									className="h-6 w-6 rounded-full border border-white/25 object-cover"
									src={room.anchor.face}
									thumb={24}
								/>
							) : (
								<span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white/70">
									<Icon name="person" size={13} />
								</span>
							)}
							<span className="font-a61 truncate text-[12px] font-medium text-white/85">{room.anchor.name || t('lottery.room.unknownAnchor')}</span>
							{room.area_name && (
								<span className="font-a61 shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10.5px] text-white/75">
									{room.parent_area_name ? `${room.parent_area_name} · ` : ''}
									{room.area_name}
								</span>
							)}
						</div>
					</>
				) : (
					<div className="flex flex-col gap-1">
						<h2 className="text-[15px] font-semibold text-white">{t('lottery.room.empty')}</h2>
						<p className="text-[12px] text-white/70">{t('lottery.room.emptyHint')}</p>
					</div>
				)}
			</div>
		</div>
	);
});

export default RoomStage;
