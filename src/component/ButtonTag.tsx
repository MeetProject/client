'use client';

import { CSSProperties, ReactNode, useRef, useState } from 'react';

import { getAlignStyle } from '@/lib/getAlignStyle';

interface ButtonTagProperties {
	children: ReactNode;
	name: string;
	position?: 'top' | 'bottom';
	gap?: number;
	style?: CSSProperties | null;
	align?: 'left' | 'center' | 'right';
	instant?: boolean;
}

export default function ButtonTag({
	align = 'center',
	children,
	gap = 4,
	instant,
	name,
	position = 'top',
	style,
}: ButtonTagProperties) {
	const [isDrag, setIsDrag] = useState(false);
	const timerReference = useRef<NodeJS.Timeout | null>(null);

	const positionStyle = position === 'top' ? { top: `calc(-50% - ${gap}px)` } : { bottom: `calc(-50% - ${gap}px)` };

	const handleButtonMouseEnter = () => {
		if (instant) {
			setIsDrag(true);
			return;
		}
		timerReference.current = setTimeout(() => {
			setIsDrag(true);
			timerReference.current = null;
		}, 500);
	};

	const handleButtonMouseLeave = () => {
		if (timerReference.current) {
			clearTimeout(timerReference.current);
			timerReference.current = null;
		}
		setIsDrag(false);
	};
	return (
		<div className='relative w-full' onMouseEnter={handleButtonMouseEnter} onMouseLeave={handleButtonMouseLeave}>
			{children}
			{isDrag && (
				<div
					className={`absolute z-10 flex h-6 w-max ${getAlignStyle(align)} items-center rounded-md bg-black-75 px-2 text-xs text-white`}
					style={{ ...positionStyle, ...style }}
				>
					{name}
				</div>
			)}
		</div>
	);
}
