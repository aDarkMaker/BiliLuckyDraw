import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Input, Spinner } from '@heroui/react';
import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'react-hot-toast';

import Icon from '@/components/icon';
import { fieldClassNames } from '@/components/field';
import Logo from '@/components/logo';
import { useApp } from '@/contexts/app';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import { errorMessage } from '@/utils/json';
import { LoginBackdrop } from '@/features/session/components/login_backdrop';
import { useTilt } from '@/features/session/useTilt';

import { useQRLogin } from './useQRLogin';

type Mode = 'cookie' | 'qrcode';

const EASE = [0.22, 1, 0.36, 1] as const;
const fade = (reduced: boolean | null) =>
	reduced ? { duration: 0 } : { duration: 0.2, ease: EASE };

const tabClass = (active: boolean) =>
	clsx(
		'flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium outline-none transition-colors',
		'focus-visible:ring-2 focus-visible:ring-primary/40',
		active ? 'bg-content1 text-foreground shadow-sm' : 'text-default-500 hover:text-foreground'
	);

export const LoginPage: React.FC = () => {
	const { t } = useI18n();
	const { signIn, signInWithQRCode, notify } = useApp();
	const { isDark, toggleMode } = useTheme();
	const reduced = useReducedMotion();

	const [mode, setMode] = useState<Mode>('cookie');
	const [cookie, setCookie] = useState('');
	const [busy, setBusy] = useState(false);
	const submitting = useRef(0);
	const { cardRef, tilt, glow, onMove, onLeave } = useTilt(!reduced);

	const qr = useQRLogin({
		active: mode === 'qrcode',
		onNotice: notify,
		onSignedIn: async (value) => {
			notify(t('login.toast.verifying'));
			notify(await signInWithQRCode(value));
		},
	});

	const { prepare: prepareQR } = qr;

	useEffect(() => {
		if (mode === 'qrcode') prepareQR();
	}, [mode, prepareQR]);

	const switchMode = useCallback(
		(next: Mode) => {
			if (next === mode) return;
			submitting.current += 1;
			setBusy(false);
			toast.dismiss();
			setMode(next);
		},
		[mode]
	);

	const submitCookie = async () => {
		if (!cookie.trim() || busy) return;

		const token = ++submitting.current;
		setBusy(true);
		try {
			const message = await signIn(cookie);
			if (token === submitting.current) notify(message);
		} catch (error) {
			if (token === submitting.current) notify(t('login.toast.loginFailed', { error: errorMessage(error) }));
		} finally {
			if (token === submitting.current) setBusy(false);
		}
	};

	const transition = reduced ? { duration: 0 } : { duration: 0.28, ease: EASE };

	return (
		<div className="relative flex h-screen select-none flex-col overflow-hidden">
			<LoginBackdrop />

			<main className="flex w-full flex-grow flex-col items-center justify-center">
				<motion.div
					animate={{ opacity: 1, y: 0 }}
					className="w-[608px] max-w-full overflow-hidden px-2 py-8 md:px-8"
					initial={{ opacity: 0, y: 12 }}
					transition={transition}
				>
					<div
						ref={cardRef}
						className="relative flex flex-col items-center gap-3 overflow-hidden rounded-large bg-default-50/50 pb-5 pt-0 shadow-medium backdrop-blur-lg"
						style={{
							transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
							transition: reduced ? undefined : 'transform 120ms ease-out',
						}}
						onMouseLeave={onLeave}
						onMouseMove={onMove}
					>
						<div
							aria-hidden
							className="pointer-events-none absolute h-[150px] w-[150px] rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 blur-[100px] transition-opacity duration-300"
							style={{
								left: glow.x - 75,
								top: glow.y - 75,
								opacity: glow.on ? 0.55 : 0,
							}}
						/>

						<button
							aria-label={t('login.theme')}
							className="absolute right-4 top-4 z-20 rounded-lg p-1 text-default-500 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-focus"
							type="button"
							onClick={toggleMode}
						>
							<Icon name={isDark ? 'light-mode' : 'dark-mode'} size={22} />
						</button>

						<div className="z-10 inline-block w-full max-w-lg justify-center p-3 text-center">
							<div className="flex w-full items-center justify-center gap-2 pt-10">
								<Logo className="rounded-large" size={112} />
								<div className="text-left">
									<span className="inline text-[2.3rem] font-semibold leading-9 tracking-tight lg:text-5xl">
										{t('login.brandLeft')}&nbsp;
									</span>
									<span className="inline bg-gradient-to-b from-primary-400 to-primary-600 bg-clip-text text-[2.3rem] font-semibold leading-9 tracking-tight text-transparent lg:text-5xl">
										{t('login.brandRight')}&nbsp;
									</span>
								</div>
							</div>
						</div>

						<div className="flex w-full flex-col px-5 pb-1 pt-2 md:px-10">
							<div className="mb-4 flex gap-1 rounded-full bg-default-100/70 p-1 dark:bg-default/60">
								<button
									aria-pressed={mode === 'qrcode'}
									className={tabClass(mode === 'qrcode')}
									type="button"
									onClick={() => switchMode('qrcode')}
								>
									<Icon name="qr-code" size={15} />
									{t('login.scanLogin')}
								</button>
								<button
									aria-pressed={mode === 'cookie'}
									className={tabClass(mode === 'cookie')}
									type="button"
									onClick={() => switchMode('cookie')}
								>
									<Icon name="key" size={15} />
									{t('login.cookieMode')}
								</button>
							</div>

							<div className="relative grid">
							<motion.div
								animate={{ opacity: mode === 'cookie' ? 1 : 0 }}
								aria-hidden={mode !== 'cookie'}
								className={clsx(
									'col-start-1 row-start-1 flex flex-col gap-4',
									mode !== 'cookie' && 'pointer-events-none'
								)}
								initial={false}
								transition={fade(reduced)}
							>
								<Input
									classNames={fieldClassNames}
									isClearable
									isDisabled={busy || mode !== 'cookie'}
									label={t('login.cookie')}
									placeholder={t('login.cookiePlaceholder')}
									radius="lg"
									size="lg"
									tabIndex={mode === 'cookie' ? 0 : -1}
									value={cookie}
									onClear={() => setCookie('')}
									onKeyDown={(e) => {
										if (e.key === 'Enter') submitCookie();
									}}
									onValueChange={setCookie}
								/>

								<p className="px-2 text-center text-small text-default-600 dark:text-default-400">{t('login.hint')}</p>

								<button
									className="mx-10 mt-3 flex h-12 items-center justify-center gap-3 rounded-full bg-primary px-6 text-lg text-primary-foreground shadow-lg shadow-primary/40 outline-none transition-transform data-[pressed=true]:scale-[0.97] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
									disabled={busy || !cookie.trim() || mode !== 'cookie'}
									tabIndex={mode === 'cookie' ? 0 : -1}
									type="button"
									onClick={submitCookie}
								>
									{busy ? <Spinner color="current" size="sm" /> : <Logo className="-ml-6 rounded-large" size={36} />}
									{t('login.loginButton')}
								</button>
							</motion.div>

							<motion.div
								animate={{ opacity: mode === 'qrcode' ? 1 : 0 }}
								aria-hidden={mode !== 'qrcode'}
								className={clsx(
									'col-start-1 row-start-1 flex flex-col items-center justify-center gap-2.5',
									mode !== 'qrcode' && 'pointer-events-none'
								)}
								initial={false}
								transition={fade(reduced)}
							>
								<div className="flex aspect-square w-[min(11.5rem,100%)] items-center justify-center overflow-hidden rounded-large bg-white p-[0.55em] shadow-medium">
									{qr.image ? (
										<img alt="QR" className="block h-full w-full" src={qr.image} />
									) : (
										<Spinner color="primary" size="lg" />
									)}
								</div>

								<p
									className="w-full truncate px-1 text-center text-[12.5px] leading-none text-default-600 dark:text-default-400"
									title={
										qr.stage === 'failed'
											? t('login.toast.qrFailed', { error: qr.error })
											: undefined
									}
								>
									{qr.stage === 'expired'
										? t('login.toast.expired')
										: qr.stage === 'failed'
											? t('login.toast.qrFailed', { error: qr.error })
											: qr.stage === 'scanned'
												? t('login.toast.scanned')
												: t('login.qrcodeTip')}
								</p>

								<div className="flex items-center justify-center pt-0.5">
									<button
										className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-default-200/70 px-4 text-sm text-default-600 outline-none transition-colors hover:bg-default-500/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 dark:border-white/10"
										disabled={qr.stage === 'loading' || mode !== 'qrcode'}
										tabIndex={mode === 'qrcode' ? 0 : -1}
										type="button"
										onClick={qr.refresh}
									>
										<Icon name="refresh" size={14} />
										{t('login.qrRefresh')}
									</button>
								</div>
							</motion.div>
							</div>
						</div>
					</div>
				</motion.div>
			</main>
		</div>
	);
};

export default LoginPage;
