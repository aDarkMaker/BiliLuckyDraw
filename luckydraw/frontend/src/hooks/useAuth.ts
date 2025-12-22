import { useState, useEffect } from "react";
import {
  IsLoggedIn,
  GetAccountInfo,
  GetBackgroundImage,
  GetWatchedRooms,
} from "../../wailsjs/go/main/App";

export const useAuth = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [watchedRooms, setWatchedRooms] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccountInfo = async () => {
    try {
      const info = await GetAccountInfo();
      if (info) {
        setAccountInfo(JSON.parse(info));
      }
    } catch (e) {
      setAccountInfo({ name: "Unknown", uid: 0 });
    }
  };

  const loadBackgroundImage = async () => {
    try {
      const bg = await GetBackgroundImage();
      setBackgroundImage(bg || "");
    } catch (e) {
      // ignore
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
      setWatchedRooms([]);
    }
  };

  const loadAll = async () => {
    await Promise.all([
      loadAccountInfo(),
      loadBackgroundImage(),
      loadWatchedRooms(),
    ]);
    setLoggedIn(true);
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
        // ignore
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
