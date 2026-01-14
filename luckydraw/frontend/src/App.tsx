import { useState } from 'react';
import { Logout } from '../wailsjs/go/main/App';
import { useAuth } from './hooks/useAuth';
import { useLottery } from './hooks/useLottery';
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
	const [view, setView] = useState<View>('lottery');
	const [message, setMessage] = useState('');

	const { loggedIn, setLoggedIn, accountInfo, backgroundImage, setBackgroundImage, watchedRooms, loadAll, loadWatchedRooms } = useAuth();

	const {
		keyword,
		setKeyword,
		winnerCount,
		setWinnerCount,
		lotteryRunning,
		participantCount,
		winners,
		showResults,
		isConnecting,
		handleStartLottery,
		resetLottery,
	} = useLottery(watchedRooms);

	const handleLoginSuccess = async () => {
		setLoggedIn(true);
		await loadAll();
		setView('lottery');
	};

	const handleLogout = async () => {
		try {
			await Logout();
			setLoggedIn(false);
			setView('lottery');
			onMessage('Logged out');
		} catch (e: any) {
			onMessage('Logout failed: ' + e.message);
		}
	};

	const onMessage = (msg: string) => {
		setMessage(msg);
	};

	const handleStartLotteryWithMessage = async () => {
		await handleStartLottery(onMessage);
	};

	return (
		<div
			className={`app-container ${backgroundImage ? 'has-bg' : ''}`}
			style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none' }}
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
			/>
			<div className="app-content">
				{!loggedIn ? (
					view === 'settings' ? (
						<SettingsView
							accountInfo={accountInfo}
							backgroundImage={backgroundImage}
							watchedRooms={watchedRooms}
							loggedIn={loggedIn}
							onLogout={handleLogout}
							onBackgroundImageChange={setBackgroundImage}
							onWatchedRoomsChange={loadWatchedRooms}
							onMessage={onMessage}
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
						onLogout={handleLogout}
						onBackgroundImageChange={setBackgroundImage}
						onWatchedRoomsChange={loadWatchedRooms}
						onMessage={onMessage}
					/>
				)}
			</div>
			<MessageToast message={message} onClose={() => setMessage('')} />
		</div>
	);
}

export default App;
