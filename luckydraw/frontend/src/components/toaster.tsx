import React from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';

export const Toaster: React.FC = () => (
	<HotToaster
		gutter={10}
		position="top-center"
		toastOptions={{
			duration: 2600,
			className: 'surface toast-pill',
			style: {
				borderRadius: '999px',
				padding: '10px 18px',
				fontSize: '13px',
				fontWeight: 500,
				color: 'hsl(var(--heroui-foreground))',
			},
			success: { iconTheme: { primary: 'hsl(var(--heroui-primary))', secondary: 'hsl(var(--surface))' } },
			error: { iconTheme: { primary: 'hsl(var(--heroui-danger))', secondary: 'hsl(var(--surface))' } },
		}}
	/>
);

export default Toaster;
