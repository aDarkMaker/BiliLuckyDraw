import React, { useState } from 'react';
import QRCode from 'qrcode';
import { Button } from './Button';
import { AppService } from '../../bindings/luckydraw/internal/app';
import { useI18n } from '../i18n';
import '../styles/LoginView.css';

interface LoginViewProps {
	onLoginSuccess: () => void;
	onMessage: (message: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onMessage }) => {
	const { t } = useI18n();
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
					const result = await AppService.CheckQRCodeStatus(qrcodeKey);
					const status = JSON.parse(result);

					if (status.code === 0 && status.data.code === 0) {
						clearInterval(interval);
						isLoggingIn.current = true;
						handleQRLogin(status.cookie);
					} else if (status.data.code === 86038) {
						clearInterval(interval);
						onMessage(t('login.toast.expired'));
						setShowQRCode(false);
					} else if (status.data.code === 86090) {
						onMessage(t('login.toast.scanned'));
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
			const result = await AppService.GetQRCode();
			const qrInfo = JSON.parse(result);
			setQrcodeKey(qrInfo.qrcode_key);

			const qrDataUrl = await QRCode.toDataURL(qrInfo.url, {
				width: 200,
				margin: 2,
			});
			setQrCodeDataUrl(qrDataUrl);

			setShowQRCode(true);
			onMessage(t('login.toast.pleaseScan'));
		} catch (e: any) {
			onMessage(t('login.toast.qrFailed', { error: e.message }));
		}
	};

	const handleQRLogin = async (cookie: string) => {
		try {
			onMessage(t('login.toast.verifying'));
			const result = await AppService.LoginWithQRCode(cookie);
			onMessage(result);
			setShowQRCode(false);
			onLoginSuccess();
		} catch (e: any) {
			onMessage(t('login.toast.loginFailed', { error: e.message }));
			setShowQRCode(false);
			isLoggingIn.current = false;
		}
	};

	const handleLogin = async () => {
		try {
			const result = await AppService.Login(cookie);
			onMessage(result);
			onLoginSuccess();
		} catch (e: any) {
			onMessage(t('login.toast.loginFailed', { error: e.message }));
		}
	};

	return (
		<div className="login-view">
			<div className="login-view-content">
				<div className="login-card">
					<h1 className="login-title">{t('login.title')}</h1>

					{!showQRCode ? (
						<div className="login-actions">
							<Button variant="primary" size="large" onClick={handleGetQRCode}>
								{t('login.scanLogin')}
							</Button>
							<div className="login-divider">
								<span>{t('login.cookieDivider')}</span>
							</div>
							<textarea className="cookie-input" placeholder={t('login.cookiePlaceholder')} value={cookie} onChange={(e) => setCookie(e.target.value)} rows={4} />
							<Button variant="secondary" size="large" onClick={handleLogin}>
								{t('login.loginButton')}
							</Button>
						</div>
					) : (
						<div className="qrcode-container">
							<div className="qrcode-wrapper">
								<img src={qrCodeDataUrl} alt="QR Code" className="qrcode" />
							</div>
							<p className="qrcode-tip">{t('login.qrcodeTip')}</p>
							<Button variant="text" onClick={() => setShowQRCode(false)}>
								{t('login.back')}
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
