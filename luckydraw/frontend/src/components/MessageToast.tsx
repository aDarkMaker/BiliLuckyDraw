import React from 'react';
import '../styles/components.css';

interface MessageToastProps {
	message: string;
	onClose: () => void;
}

export const MessageToast: React.FC<MessageToastProps> = ({ message, onClose }) => {
	if (!message) return null;

	return (
		<div className="message" onClick={onClose}>
			{message}
		</div>
	);
};
