import React from 'react';
import '../styles/components.css';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	size?: 'small';
	className?: string;
}

export const Input: React.FC<InputProps> = ({ size, className = '', ...props }) => {
	const classes = ['input', size && `input-${size}`, props.type === 'number' && 'input-number', className].filter(Boolean).join(' ');

	return <input className={classes} {...props} />;
};
