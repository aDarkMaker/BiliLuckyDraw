import React, { useEffect } from 'react';
import { Button } from './Button';
import '../styles/ConfirmDialog.css';

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	danger?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
	open,
	title,
	message,
	confirmText,
	cancelText,
	danger,
	onConfirm,
	onCancel,
}) => {
	useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onCancel();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open, onCancel]);

	if (!open) return null;

	return (
		<div className="confirm-overlay" onMouseDown={onCancel}>
			<div className="confirm-dialog" onMouseDown={(e) => e.stopPropagation()}>
				<h3 className="confirm-title">{title}</h3>
				<p className="confirm-message">{message}</p>
				<div className="confirm-actions">
					<Button variant="secondary" onClick={onCancel}>
						{cancelText}
					</Button>
					<Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
						{confirmText}
					</Button>
				</div>
			</div>
		</div>
	);
};
