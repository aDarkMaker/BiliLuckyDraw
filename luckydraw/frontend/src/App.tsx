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

	const { loggedIn, setLoggedIn, accountInfo, backgroundImage, setBackgroundImage, watchedRooms, setWatchedRooms, loadAll, loadWatchedRooms } =
		useAuth();

	const {
		keyword,
		setKeyword,
		winnerCount,
		setWinnerCount,
		lotteryRunning,
		participantCount,
		winners,
		showResults,
		handleStartLottery,
		resetLottery,
	} = useLottery(watchedRooms);

	const handleLoginSuccess = async () => {
		await loadAll();
		setView('lottery');
	};

	const handleLogout = async () => {
		try {
			await Logout();
			setLoggedIn(false);
			setView('lottery');
			setMessage('已退出登录');
		} catch (e: any) {
			setMessage('退出失败: ' + e.message);
		}
	};

	const handleStartLotteryWithMessage = async () => {
		await handleStartLottery(setMessage);
	};

	const bgStyle = backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {};

	if (!loggedIn) {
		return (
			<div className="app-container" style={bgStyle}>
				<div className="app-content">
					<LoginView onLoginSuccess={handleLoginSuccess} onMessage={setMessage} />
					<MessageToast message={message} onClose={() => setMessage('')} />
				</div>
			</div>
		);
	}

	return (
		<div
			className={`app-container ${backgroundImage ? "has-bg" : ""}`}
			style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none" }}
		>
			<div className="app-content">
				<TopBar
					keyword={keyword}
					onKeywordChange={setKeyword}
					winnerCount={winnerCount}
					onWinnerCountChange={setWinnerCount}
					lotteryRunning={lotteryRunning}
					onSettingsToggle={() => setView(view === 'settings' ? 'lottery' : 'settings')}
					isSettingsOpen={view === 'settings'}
				/>

				{view === 'lottery' ? (
					<LotteryView
						lotteryRunning={lotteryRunning}
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
						onLogout={handleLogout}
						onBackgroundImageChange={setBackgroundImage}
						onWatchedRoomsChange={loadWatchedRooms}
						onMessage={setMessage}
					/>
				)}

				<MessageToast message={message} onClose={() => setMessage('')} />
			</div>
		</div>
	);
}

export default App;
