import React, { useEffect, useState } from 'react';
import '../styles/components.css';

interface MessageToastProps {
	message: string;
	onClose: () => void;
}

export const MessageToast: React.FC<MessageToastProps> = ({ message, onClose }) => {
	const [visible, setVisible] = useState(false);
	const [activeMessage, setActiveMessage] = useState('');

	useEffect(() => {
		if (message) {
			setActiveMessage(message);
			setVisible(true);
			const timer = setTimeout(() => {
				setVisible(false);
				setTimeout(() => {
					onClose();
				}, 300);
			}, 1800);
			return () => clearTimeout(timer);
		}
	}, [message, onClose]);

	if (!activeMessage) return null;

	return (
		<div className={`message-toast ${visible ? 'is-visible' : ''}`} onClick={() => setVisible(false)}>
			{activeMessage}
		</div>
	);
};
