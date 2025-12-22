import React from 'react';
import '../styles/components.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'danger' | 'text';
	size?: 'small' | 'large';
	className?: string;
	children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size, className = '', children, ...props }) => {
	const classes = ['btn', `btn-${variant}`, size && `btn-${size}`, className].filter(Boolean).join(' ');

	return (
		<button className={classes} {...props}>
			{children}
		</button>
	);
};
