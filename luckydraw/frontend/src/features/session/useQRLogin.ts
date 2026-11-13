import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

import { useI18n } from '@/i18n';
import { authApi } from '@/services/api';
import { errorMessage } from '@/utils/json';

export type QRStage = 'idle' | 'loading' | 'ready' | 'scanned' | 'expired' | 'failed';

interface QRLoginOptions {
	active: boolean;
	onSignedIn: (cookie: string) => Promise<void>;
	onNotice: (message: string) => void;
}

interface QRLoginResult {
	stage: QRStage;
	image: string;
	error: string;
	prepare: () => void;
	refresh: () => void;
}

export const useQRLogin = ({ active, onSignedIn, onNotice }: QRLoginOptions): QRLoginResult => {
	const { t } = useI18n();
	const [stage, setStage] = useState<QRStage>('idle');
	const [image, setImage] = useState('');
	const [error, setError] = useState('');

	const activeRef = useRef(active);
	const keyRef = useRef('');
	const stageRef = useRef<QRStage>('idle');
	const epochRef = useRef(0);
	const pendingRef = useRef<number | null>(null);
	const claimingRef = useRef(false);
	const scannedRef = useRef(false);
	const aliveRef = useRef(true);
	const signedInRef = useRef(onSignedIn);
	const noticeRef = useRef(onNotice);

	activeRef.current = active;
	signedInRef.current = onSignedIn;
	noticeRef.current = onNotice;
	stageRef.current = stage;

	useEffect(() => {
		aliveRef.current = true;
		return () => {
			aliveRef.current = false;
			epochRef.current += 1;
			pendingRef.current = null;
			keyRef.current = '';
		};
	}, []);

	const generate = useCallback(async () => {
		if (pendingRef.current !== null) return;

		const epoch = ++epochRef.current;
		pendingRef.current = epoch;
		keyRef.current = '';
		claimingRef.current = false;
		scannedRef.current = false;
		setImage('');
		setError('');
		setStage('loading');

		try {
			const info = await authApi.qrCode();
			if (!aliveRef.current || epoch !== epochRef.current) return;

			const dataUrl = await QRCode.toDataURL(info.url, {
				width: 220,
				margin: 1,
				color: { dark: '#18181b', light: '#ffffff' },
			});
			if (!aliveRef.current || epoch !== epochRef.current) return;

			keyRef.current = info.qrcode_key;
			setImage(dataUrl);
			setStage('ready');
		} catch (err) {
			if (!aliveRef.current || epoch !== epochRef.current) return;
			setError(errorMessage(err));
			setStage('failed');
			if (activeRef.current) noticeRef.current(t('login.toast.qrFailed', { error: errorMessage(err) }));
		} finally {
			if (pendingRef.current === epoch) pendingRef.current = null;
		}
	}, [t]);

	const prepare = useCallback(() => {
		if (pendingRef.current !== null) return;
		if (stageRef.current === 'ready' || stageRef.current === 'scanned') return;
		void generate();
	}, [generate]);

	const refresh = useCallback(() => {
		void generate();
	}, [generate]);

	useEffect(() => {
		if (!active || stage !== 'ready' || !keyRef.current) return;

		let alive = true;
		const timer = window.setInterval(async () => {
			if (!alive || claimingRef.current) return;
			const key = keyRef.current;
			if (!key) return;

			try {
				const status = await authApi.qrStatus(key);
				if (!alive) return;

				if (status.code === 0 && status.data.code === 0 && status.cookie) {
					alive = false;
					claimingRef.current = true;
					window.clearInterval(timer);
					setStage('scanned');
					try {
						await signedInRef.current(status.cookie);
					} catch {
						claimingRef.current = false;
						keyRef.current = '';
						if (aliveRef.current) setStage('idle');
					}
				} else if (status.data.code === 86038) {
					alive = false;
					window.clearInterval(timer);
					keyRef.current = '';
					setStage('expired');
				} else if (status.data.code === 86090 && !scannedRef.current) {
					scannedRef.current = true;
					noticeRef.current(t('login.toast.scanned'));
				}
			} catch {
				// transient polling errors are expected
			}
		}, 2000);

		return () => {
			alive = false;
			window.clearInterval(timer);
		};
	}, [active, stage, t]);

	return { stage, image, error, prepare, refresh };
};

export default useQRLogin;
