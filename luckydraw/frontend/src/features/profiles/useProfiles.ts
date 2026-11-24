import { useCallback, useEffect, useRef, useState } from 'react';

import { profileApi, roomApi } from '@/services/api';
import type { Profile } from '@/types';

const configPair = (keyword: string, winnerCount: number) => `${keyword}|${winnerCount}`;

const BACKGROUND_CACHE_LIMIT = 4;

export const useProfiles = (enabled: boolean) => {
	const [profiles, setProfiles] = useState<Profile[]>([]);
	const [activeProfileId, setActiveProfileId] = useState('');
	const [watchedRooms, setWatchedRooms] = useState<number[]>([]);
	const [backgroundImage, setBackgroundImage] = useState('');
	const [keyword, setKeyword] = useState('');
	const [winnerCount, setWinnerCount] = useState(1);
	const backgroundToken = useRef(0);
	const switchToken = useRef(0);
	const activateQueue = useRef<Promise<unknown>>(Promise.resolve());
	const activeIdRef = useRef('');
	const backgroundCache = useRef(new Map<string, string>());
	const savedConfig = useRef(configPair('', 1));

	const rememberBackground = useCallback((id: string, image: string) => {
		const cache = backgroundCache.current;
		cache.delete(id);
		if (!id || !image) return;
		cache.set(id, image);
		if (cache.size > BACKGROUND_CACHE_LIMIT) {
			const oldest = cache.keys().next().value;
			if (oldest !== undefined) cache.delete(oldest);
		}
	}, []);

	const activate = useCallback((profile: Profile) => {
		const nextKeyword = profile.keyword || '';
		const nextWinnerCount = profile.winner_count || 1;
		activeIdRef.current = profile.id;
		savedConfig.current = configPair(nextKeyword, nextWinnerCount);
		setActiveProfileId(profile.id);
		setWatchedRooms(profile.watched_rooms || []);
		setKeyword(nextKeyword);
		setWinnerCount(nextWinnerCount);
	}, []);

	const loadBackground = useCallback(
		async (id: string) => {
			const token = ++backgroundToken.current;
			const cached = backgroundCache.current.get(id);
			if (cached) {
				setBackgroundImage(cached);
				return;
			}
			const image = await profileApi.background().catch(() => '');
			if (backgroundToken.current !== token) return;
			const next = image.startsWith('data:') ? image : '';
			setBackgroundImage(next);
			rememberBackground(id, next);
		},
		[rememberBackground]
	);

	const loadProfiles = useCallback(async () => {
		const payload = await profileApi.list().catch(() => ({ profiles: [], active_profile: '' }));
		setProfiles(payload.profiles);
		const active = payload.profiles.find((p) => p.id === payload.active_profile);
		if (active) {
			activate(active);
			if (active.background_image) {
				void loadBackground(active.id);
			} else {
				backgroundToken.current += 1;
				setBackgroundImage('');
			}
		} else {
			backgroundToken.current += 1;
			setActiveProfileId(payload.active_profile);
			setBackgroundImage('');
		}
	}, [activate, loadBackground]);

	const loadWatchedRooms = useCallback(async () => {
		setWatchedRooms(await roomApi.list().catch(() => []));
	}, []);

	useEffect(() => {
		if (!enabled) return;
		void loadProfiles();
		void loadWatchedRooms();
	}, [enabled, loadProfiles, loadWatchedRooms]);

	useEffect(() => {
		if (!enabled) return;
		const pair = configPair(keyword, winnerCount);
		if (pair === savedConfig.current) return;
		const timer = setTimeout(() => {
			savedConfig.current = pair;
			profileApi.saveConfig(keyword, winnerCount).catch(() => {});
		}, 400);
		return () => clearTimeout(timer);
	}, [enabled, keyword, winnerCount]);

	const applyBackgroundFor = useCallback(
		(profile: Profile) => {
			if (profile.background_image) {
				void loadBackground(profile.id);
				return;
			}
			backgroundToken.current += 1;
			setBackgroundImage('');
		},
		[loadBackground]
	);

	const switchProfile = useCallback(
		(id: string) => {
			const token = ++switchToken.current;
			const local = profiles.find((p) => p.id === id);

			if (local) {
				activate(local);
				applyBackgroundFor(local);
			}

			// Serialized so rapid clicks reach the backend in click order;
			// only the newest response is allowed to touch state.
			const request = activateQueue.current.then(() => profileApi.activate(id)).catch(() => null);
			activateQueue.current = request;

			return request.then((profile) => {
				if (switchToken.current !== token) return;
				if (!profile) {
					void loadProfiles();
					return;
				}
				setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...profile } : p)));
				if (!local) {
					activate(profile);
					applyBackgroundFor(profile);
					return;
				}
				if (profile.background_image !== local.background_image) applyBackgroundFor(profile);
			});
		},
		[profiles, activate, applyBackgroundFor, loadProfiles]
	);

	const createProfile = useCallback(
		async (name: string) => {
			const profile = await profileApi.create(name);
			if (!profile) return;
			setProfiles((prev) => [...prev, profile]);
			activate(profile);
			backgroundToken.current += 1;
			setBackgroundImage('');
		},
		[activate]
	);

	const deleteProfile = useCallback(
		async (id: string) => {
			await profileApi.remove(id);
			await loadProfiles();
		},
		[loadProfiles]
	);

	const renameProfile = useCallback(async (id: string, name: string) => {
		await profileApi.rename(id, name);
		setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
	}, []);

	const applyBackground = useCallback(
		async (image: string, blob?: Blob) => {
			await profileApi.setBackground(image, blob);
			const id = activeIdRef.current;
			setBackgroundImage(image);
			if (image) rememberBackground(id, image);
			else backgroundCache.current.delete(id);
			setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, background_image: image ? '1' : '' } : p)));
		},
		[rememberBackground]
	);

	const addRoom = useCallback(
		async (roomID: number) => {
			await roomApi.add(roomID);
			await loadWatchedRooms();
		},
		[loadWatchedRooms]
	);

	const removeRoom = useCallback(
		async (roomID: number) => {
			await roomApi.remove(roomID);
			await loadWatchedRooms();
		},
		[loadWatchedRooms]
	);

	return {
		profiles,
		activeProfileId,
		watchedRooms,
		backgroundImage,
		keyword,
		winnerCount,
		setKeyword,
		setWinnerCount,
		switchProfile,
		createProfile,
		deleteProfile,
		renameProfile,
		applyBackground,
		addRoom,
		removeRoom,
		loadProfiles,
		loadWatchedRooms,
	};
};
