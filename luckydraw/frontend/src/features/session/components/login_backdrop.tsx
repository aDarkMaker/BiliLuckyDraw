import React from 'react';

export const LoginBackdrop: React.FC = () => (
	<div
		aria-hidden
		className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
	>
		<div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-primary-200/40 blur-[100px]" />
		<div className="absolute right-[-10%] top-[20%] h-[400px] w-[400px] rounded-full bg-secondary-200/40 blur-[90px]" />
		<div className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-primary-200/30 blur-[110px] dark:bg-primary/20" />
	</div>
);

export default LoginBackdrop;
