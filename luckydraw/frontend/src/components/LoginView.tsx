import React, { useState } from 'react';
import QRCode from 'qrcode';
import { Button } from './Button';
import { GetQRCode, CheckQRCodeStatus, LoginWithQRCode, Login } from '../../wailsjs/go/main/App';
import './LoginView.css';

interface LoginViewProps {
	onLoginSuccess: () => void;
	onMessage: (message: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onMessage }) => {
	const [cookie, setCookie] = useState('');
	const [showQRCode, setShowQRCode] = useState(false);
	const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
	const [qrcodeKey, setQrcodeKey] = useState('');
	const isLoggingIn = React.useRef(false);

	React.useEffect(() => {
		if (showQRCode && qrcodeKey) {
			isLoggingIn.current = false;
			const interval = setInterval(async () => {
				if (isLoggingIn.current) {
					return;
				}

				try {
					const result = await CheckQRCodeStatus(qrcodeKey);
					const status = JSON.parse(result);

					if (status.code === 0 && status.data.code === 0) {
						clearInterval(interval);
						isLoggingIn.current = true;
						handleQRLogin(status.data.url);
					} else if (status.data.code === 86038) {
						clearInterval(interval);
						onMessage('二维码已过期，请重新获取');
						setShowQRCode(false);
					} else if (status.data.code === 86090) {
						onMessage('已扫码，请在手机上确认登录');
					}
				} catch (e: any) {
					console.error('检查状态失败:', e);
				}
			}, 2000);
			return () => clearInterval(interval);
		}
	}, [showQRCode, qrcodeKey]);

	const handleGetQRCode = async () => {
		try {
			const result = await GetQRCode();
			const qrInfo = JSON.parse(result);
			setQrcodeKey(qrInfo.qrcode_key);

			const qrDataUrl = await QRCode.toDataURL(qrInfo.url, {
				width: 200,
				margin: 2,
			});
			setQrCodeDataUrl(qrDataUrl);

			setShowQRCode(true);
			onMessage('请使用B站APP扫描二维码');
		} catch (e: any) {
			onMessage('获取二维码失败: ' + e.message);
		}
	};

	const handleQRLogin = async (loginURL: string) => {
		try {
			onMessage('正在验证登录...');
			const result = await LoginWithQRCode(loginURL);
			onMessage(result);
			setShowQRCode(false);
			onLoginSuccess();
		} catch (e: any) {
			onMessage('登录失败: ' + e.message);
			setShowQRCode(false);
			isLoggingIn.current = false;
		}
	};

	const handleLogin = async () => {
		try {
			const result = await Login(cookie);
			onMessage(result);
			onLoginSuccess();
		} catch (e: any) {
			onMessage('登录失败: ' + e.message);
		}
	};

	return (
		<div className="login-view">
			<div className="login-card">
				<h1 className="login-title">B站直播间抽奖助手</h1>

				{!showQRCode ? (
					<div className="login-actions">
						<Button variant="primary" size="large" onClick={handleGetQRCode}>
							扫码登录
						</Button>
						<div className="login-divider">
							<span>或</span>
						</div>
						<textarea className="input" placeholder="粘贴Cookie后点击登录" value={cookie} onChange={(e) => setCookie(e.target.value)} rows={6} />
						<Button variant="secondary" size="large" onClick={handleLogin}>
							Cookie登录
						</Button>
					</div>
				) : (
					<div className="qrcode-container">
						<img src={qrCodeDataUrl} alt="二维码" className="qrcode" />
						<p className="qrcode-tip">请使用B站APP扫描二维码</p>
						<Button variant="secondary" onClick={() => setShowQRCode(false)}>
							取消
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};
