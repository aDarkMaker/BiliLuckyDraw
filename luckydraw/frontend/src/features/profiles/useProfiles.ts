import { useCallback, useEffect, useState } from 'react';

import { profileApi, roomApi } from '@/services/api';
import type { Profile } from '@/types';

export const useProfiles = (enabled: boolean) => {
	const [profiles, setProfiles] = useState<Profile[]>([]);
	const [activeProfileId, setActiveProfileId] = useState('');
	const [watchedRooms, setWatchedRooms] = useState<number[]>([]);
	const [backgroundImage, setBackgroundImage] = useState('');
	const [keyword, setKeyword] = useState('');
	const [winnerCount, setWinnerCount] = useState(1);

	const activate = useCallback((profile: Profile) => {
		setActiveProfileId(profile.id);
		setBackgroundImage(profile.background_image || '');
		setWatchedRooms(profile.watched_rooms || []);
		setKeyword(profile.keyword || '');
		setWinnerCount(profile.winner_count || 1);
	}, []);

	const loadProfiles = useCallback(async () => {
		const payload = await profileApi.list().catch(() => ({ profiles: [], active_profile: '' }));
		setProfiles(payload.profiles);
		const active = payload.profiles.find((p) => p.id === payload.active_profile);
		if (active) activate(active);
		else setActiveProfileId(payload.active_profile);
	}, [activate]);

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
		const timer = setTimeout(() => {
			profileApi.saveConfig(keyword, winnerCount).catch(() => {});
		}, 400);
		return () => clearTimeout(timer);
	}, [enabled, keyword, winnerCount]);

	const switchProfile = useCallback(
		async (id: string) => {
			const profile = await profileApi.activate(id);
			if (!profile) return;
			setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...profile } : p)));
			activate(profile);
		},
		[activate]
	);

	const createProfile = useCallback(
		async (name: string) => {
			const profile = await profileApi.create(name);
			if (!profile) return;
			setProfiles((prev) => [...prev, profile]);
			activate(profile);
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

	const applyBackground = useCallback(async (image: string) => {
		await profileApi.setBackground(image);
		setBackgroundImage(image);
	}, []);

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
