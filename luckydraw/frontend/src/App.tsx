import { useState, useEffect } from 'react';
import { AppService } from '../bindings/luckydraw/internal/app';
import { useAuth } from './hooks/useAuth';
import { useLottery } from './hooks/useLottery';
import { useI18n } from './i18n';
import { useThemeBackground } from './themes';
import { LoginView } from './components/LoginView';
import { TopBar } from './components/TopBar';
import { LotteryView } from './components/LotteryView';
import { SettingsView } from './components/SettingsView';
import { MessageToast } from './components/MessageToast';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';

type View = 'lottery' | 'settings';

function App() {
	const { t } = useI18n();
	const [view, setView] = useState<View>('lottery');
	const [message, setMessage] = useState('');
	const themeBackground = useThemeBackground();

	const {
		loggedIn,
		setLoggedIn,
		accountInfo,
		backgroundImage,
		setBackgroundImage,
		watchedRooms,
		profiles,
		activeProfileId,
		keyword,
		setKeyword,
		winnerCount,
		setWinnerCount,
		switchProfile,
		createProfile,
		deleteProfile,
		renameProfile,
		loadAll,
		loadWatchedRooms,
	} = useAuth();

	const {
		lotteryRunning,
		participantCount,
		winners,
		showResults,
		isConnecting,
		handleStartLottery,
		resetLottery,
	} = useLottery(watchedRooms, keyword, winnerCount);

	const handleLoginSuccess = async () => {
		setLoggedIn(true);
		await loadAll();
		setView('lottery');
	};

	const handleLogout = async () => {
		try {
			await AppService.Logout();
			setLoggedIn(false);
			setView('lottery');
			onMessage(t('app.toast.loggedOut'));
		} catch (e: any) {
			onMessage(t('app.toast.logoutFailed', { error: e.message }));
		}
	};

	const onMessage = (msg: string) => {
		setMessage(msg);
	};

	const handleStartLotteryWithMessage = async () => {
		await handleStartLottery(onMessage);
	};

	const appBackground = themeBackground || backgroundImage;

	const handleContentMouseDown = (e: React.MouseEvent) => {
		if (view !== 'settings') return;
		if (!(e.target as HTMLElement).closest('.settings-card')) setView('lottery');
	};

	return (
		<div
			className={`app-container ${appBackground ? 'has-bg' : ''}`}
			style={{ backgroundImage: appBackground ? `url(${appBackground})` : 'none' }}
		>
			<TopBar
				keyword={keyword}
				onKeywordChange={setKeyword}
				winnerCount={winnerCount}
				onWinnerCountChange={setWinnerCount}
				lotteryRunning={lotteryRunning}
				onSettingsToggle={() => setView(view === 'settings' ? 'lottery' : 'settings')}
				isSettingsOpen={view === 'settings'}
				loggedIn={loggedIn}
				userAvatar={accountInfo?.face}
				profiles={profiles}
				activeProfileId={activeProfileId}
				onSwitchProfile={switchProfile}
				onCreateProfile={(name) => { createProfile(name); }}
				onDeleteProfile={(id) => { deleteProfile(id); }}
				onRenameProfile={(id, name) => { renameProfile(id, name); }}
			/>
			<div className="app-content" onMouseDown={handleContentMouseDown}>
				{!loggedIn ? (
					view === 'settings' ? (
						<SettingsView
							accountInfo={accountInfo}
							backgroundImage={backgroundImage}
							watchedRooms={watchedRooms}
							loggedIn={loggedIn}
							lotteryRunning={lotteryRunning}
							onLogout={handleLogout}
							onBackgroundImageChange={setBackgroundImage}
							onWatchedRoomsChange={loadWatchedRooms}
							onMessage={onMessage}
							profiles={profiles}
							activeProfileId={activeProfileId}
							onCreateProfile={(name) => { createProfile(name); }}
							onDeleteProfile={(id) => { deleteProfile(id); }}
							onRenameProfile={(id, name) => { renameProfile(id, name); }}
							onSwitchProfile={switchProfile}
						/>
					) : (
						<LoginView onLoginSuccess={handleLoginSuccess} onMessage={onMessage} />
					)
				) : view === 'lottery' ? (
					<LotteryView
						lotteryRunning={lotteryRunning}
						isConnecting={isConnecting}
						participantCount={participantCount}
						showResults={showResults}
						winners={winners}
						onStartLottery={handleStartLotteryWithMessage}
						onReset={resetLottery}
					/>
				) : (
					<SettingsView
						accountInfo={accountInfo}
						backgroundImage={backgroundImage}
						watchedRooms={watchedRooms}
						loggedIn={loggedIn}
						lotteryRunning={lotteryRunning}
						onLogout={handleLogout}
						onBackgroundImageChange={setBackgroundImage}
						onWatchedRoomsChange={loadWatchedRooms}
						onMessage={onMessage}
						profiles={profiles}
						activeProfileId={activeProfileId}
						onCreateProfile={(name) => { createProfile(name); }}
						onDeleteProfile={(id) => { deleteProfile(id); }}
						onRenameProfile={(id, name) => { renameProfile(id, name); }}
						onSwitchProfile={switchProfile}
					/>
				)}
			</div>
			<MessageToast message={message} onClose={() => setMessage('')} />
		</div>
	);
}

export default App;