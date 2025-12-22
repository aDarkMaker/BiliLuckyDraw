import { useState, useEffect } from 'react';
import { IsLoggedIn, GetAccountInfo, GetBackgroundImage, GetWatchedRooms } from '../../wailsjs/go/main/App';

export const useAuth = () => {
	const [loggedIn, setLoggedIn] = useState(false);
	const [accountInfo, setAccountInfo] = useState<any>(null);
	const [backgroundImage, setBackgroundImage] = useState('');
	const [watchedRooms, setWatchedRooms] = useState<number[]>([]);
	const [loading, setLoading] = useState(true);

  const loadAccountInfo = async () => {
    try {
      const info = await GetAccountInfo();
      if (info) {
        setAccountInfo(JSON.parse(info));
      }
    } catch (e) {
      console.error('加载账号信息失败:', e);
      setAccountInfo({ name: '未知用户', uid: 0 });
    }
  };

  const loadBackgroundImage = async () => {
    try {
      const bg = await GetBackgroundImage();
      setBackgroundImage(bg || '');
    } catch (e) {
      console.error('加载背景失败:', e);
    }
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
      console.error('加载监听房间失败:', e);
      setWatchedRooms([]);
    }
  };

	const loadAll = async () => {
		await Promise.all([loadAccountInfo(), loadBackgroundImage(), loadWatchedRooms()]);
	};

	useEffect(() => {
		const checkLoginStatus = async () => {
			try {
				const isLoggedIn = await IsLoggedIn();
				if (isLoggedIn) {
					setLoggedIn(true);
					await loadAll();
				}
			} catch (e) {
				console.error('检查登录状态失败:', e);
			} finally {
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
		loadAll,
		loadWatchedRooms,
		loading,
	};
};
