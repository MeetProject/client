export const getAlignStyle = (align: 'left' | 'center' | 'right') => {
	if (align === 'left') {
		return 'left-0';
	}

	if (align === 'right') {
		return 'right-0';
	}

	return 'left-1/2 -translate-x-1/2';
};
