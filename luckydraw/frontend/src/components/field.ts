import '@/styles/inputs.css';

export const fieldClassNames = {
	label: 'text-[13px] text-default-500 font-normal pb-1',
	input: 'font-a61 text-foreground caret-primary placeholder:text-default-400',
	innerWrapper: 'bg-transparent',
	inputWrapper: [
		'input-fx',
		'!outline-none',
		'!ring-0',
		'!ring-offset-0',
		'shadow-none',
		'min-h-11',
		'bg-content1/70',
		'dark:bg-content2/60',
		'backdrop-blur-xl',
		'border border-default-200/60',
		'dark:border-white/10',
		'hover:bg-content1/90',
		'group-data-[focus=true]:bg-content1',
		'dark:group-data-[focus=true]:bg-content2',
		'group-data-[focus=true]:border-primary/60',
		'group-data-[focus-visible=true]:!outline-none',
		'group-data-[focus-visible=true]:!ring-0',
		'group-data-[focus-visible=true]:!ring-offset-0',
	],
};

export default fieldClassNames;
