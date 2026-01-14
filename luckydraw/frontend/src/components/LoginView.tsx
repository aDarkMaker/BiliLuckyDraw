import React, { useState } from 'react';
import QRCode from 'qrcode';
import { Button } from './Button';
import { GetQRCode, CheckQRCodeStatus, LoginWithQRCode, Login } from '../../wailsjs/go/main/App';
import '../styles/LoginView.css';

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
						onMessage('QR code expired, please get it again');
						setShowQRCode(false);
					} else if (status.data.code === 86090) {
						onMessage('Scanned, please confirm on mobile');
					}
				} catch (e: any) {
					// ignore
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
			onMessage('Please scan the QR code with Bilibili APP');
		} catch (e: any) {
			onMessage('Failed to get QR code: ' + e.message);
		}
	};

	const handleQRLogin = async (loginURL: string) => {
		try {
			onMessage('Verifying login...');
			const result = await LoginWithQRCode(loginURL);
			onMessage(result);
			setShowQRCode(false);
			onLoginSuccess();
		} catch (e: any) {
			onMessage('Login failed: ' + e.message);
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
			onMessage('Login failed: ' + e.message);
		}
	};

	return (
		<div className="login-view">
			<div className="login-view-content">
				<div className="login-card">
					<h1 className="login-title">我要验牌</h1>

					{!showQRCode ? (
						<div className="login-actions">
							<Button variant="primary" size="large" onClick={handleGetQRCode}>
								扫码登录
							</Button>
							<div className="login-divider">
								<span>我是高手 我用 Cookie</span>
							</div>
							<textarea
								className="cookie-input"
								placeholder="Bilibili Cookie"
								value={cookie}
								onChange={(e) => setCookie(e.target.value)}
								rows={4}
							/>
							<Button variant="secondary" size="large" onClick={handleLogin}>
								就决定是你了
							</Button>
						</div>
					) : (
						<div className="qrcode-container">
							<div className="qrcode-wrapper">
								<img src={qrCodeDataUrl} alt="QR Code" className="qrcode" />
							</div>
							<p className="qrcode-tip">请使用B站手机客户端扫码</p>
							<Button variant="text" onClick={() => setShowQRCode(false)}>
								Back
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
