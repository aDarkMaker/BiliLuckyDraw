import { useState, useEffect, useCallback } from 'react';
import {
	IsLoggedIn,
	GetAccountInfo,
	GetBackgroundImage,
	GetWatchedRooms,
	GetProfiles,
	SwitchProfile,
	CreateProfile,
	DeleteProfile,
	RenameProfile,
} from '../../wailsjs/go/main/App';

interface Profile {
	id: string;
	name: string;
	background_image: string;
	watched_rooms: number[];
	keyword: string;
	winner_count: number;
}

const goApp = () => (window as any).go?.main?.App;

export const useAuth = () => {
	const [loggedIn, setLoggedIn] = useState(false);
	const [accountInfo, setAccountInfo] = useState<any>(null);
	const [backgroundImage, setBackgroundImage] = useState('');
	const [watchedRooms, setWatchedRooms] = useState<number[]>([]);
	const [profiles, setProfiles] = useState<Profile[]>([]);
	const [activeProfileId, setActiveProfileId] = useState('');
	const [keyword, setKeyword] = useState('');
	const [winnerCount, setWinnerCount] = useState(1);
	const [loading, setLoading] = useState(true);

	const loadAccountInfo = async () => {
		try {
			const info = await GetAccountInfo();
			if (info) {
				setAccountInfo(JSON.parse(info));
			}
		} catch (e) {
			setAccountInfo({ name: 'Unknown', uid: 0 });
		}
	};

	const loadBackgroundImage = async () => {
		try {
			const bg = await GetBackgroundImage();
			setBackgroundImage(bg || '');
		} catch (e) {}
	};

	const loadWatchedRooms = async () => {
		try {
			const rooms = await GetWatchedRooms();
			if (rooms) {
				setWatchedRooms(JSON.parse(rooms));
			} else {
				setWatchedRooms([]);
			}
		} catch (e) {
			setWatchedRooms([]);
		}
	};

	const loadProfiles = async () => {
		try {
			const data = await GetProfiles();
			const parsed = JSON.parse(data);
			setProfiles(parsed.profiles || []);
			setActiveProfileId(parsed.active_profile || '');

			const activeProfile = (parsed.profiles || []).find((p: Profile) => p.id === parsed.active_profile);
			if (activeProfile) {
				setKeyword(activeProfile.keyword || '');
				setWinnerCount(activeProfile.winner_count || 1);
			}
		} catch (e) {}
	};

	const loadAll = async () => {
		await Promise.all([loadAccountInfo(), loadBackgroundImage(), loadWatchedRooms(), loadProfiles()]);
		setLoggedIn(true);
	};

	const handleSwitchProfile = useCallback(async (id: string) => {
		try {
			const data = await SwitchProfile(id);
			const profile: Profile = JSON.parse(data);
			setActiveProfileId(profile.id);
			setBackgroundImage(profile.background_image || '');
			setWatchedRooms(profile.watched_rooms || []);
			setKeyword(profile.keyword || '');
			setWinnerCount(profile.winner_count || 1);
			setProfiles((prev) =>
				prev.map((p) => (p.id === id ? { ...p, ...profile } : p)),
			);
		} catch (e) {}
	}, []);

	const handleCreateProfile = useCallback(async (name: string) => {
		try {
			const data = await CreateProfile(name);
			const profile: Profile = JSON.parse(data);
			setActiveProfileId(profile.id);
			setBackgroundImage(profile.background_image || '');
			setWatchedRooms(profile.watched_rooms || []);
			setKeyword(profile.keyword || '');
			setWinnerCount(profile.winner_count || 1);
			setProfiles((prev) => [...prev, profile]);
		} catch (e) {}
	}, []);

	const handleDeleteProfile = useCallback(async (id: string) => {
		try {
			await DeleteProfile(id);
			const data = await GetProfiles();
			const parsed = JSON.parse(data);
			setProfiles(parsed.profiles || []);

			const newActiveId = parsed.active_profile || '';
			setActiveProfileId(newActiveId);
			const active = (parsed.profiles || []).find((p: Profile) => p.id === newActiveId);
			if (active) {
				setBackgroundImage(active.background_image || '');
				setWatchedRooms(active.watched_rooms || []);
				setKeyword(active.keyword || '');
				setWinnerCount(active.winner_count || 1);
			}
		} catch (e) {}
	}, []);

	const handleRenameProfile = useCallback(async (id: string, name: string) => {
		try {
			await RenameProfile(id, name);
			setProfiles((prev) =>
				prev.map((p) => (p.id === id ? { ...p, name } : p)),
			);
		} catch (e) {}
	}, []);

	useEffect(() => {
		if (!loggedIn) return;
		const timer = setTimeout(() => {
			goApp()?.SaveProfileConfig(keyword, winnerCount).catch(() => {});
		}, 500);
		return () => clearTimeout(timer);
	}, [keyword, winnerCount, loggedIn]);

	useEffect(() => {
		const checkLoginStatus = async () => {
			try {
				const isLoggedIn = await IsLoggedIn();
				if (isLoggedIn) {
					setLoggedIn(true);
					await loadAll();
				}
			} catch (e) {} finally {
				setLoading(false);
			}
		};
		checkLoginStatus();
	}, []);

	return {
		loggedIn,
		setLoggedIn,
		accountInfo,
		backgroundImage,
		setBackgroundImage,
		watchedRooms,
		setWatchedRooms,
		profiles,
		activeProfileId,
		keyword,
		setKeyword,
		winnerCount,
		setWinnerCount,
		switchProfile: handleSwitchProfile,
		createProfile: handleCreateProfile,
		deleteProfile: handleDeleteProfile,
		renameProfile: handleRenameProfile,
		loadAll,
		loadWatchedRooms,
		loadProfiles,
		loading,
	};
};