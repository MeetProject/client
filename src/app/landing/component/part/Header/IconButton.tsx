import { ReactNode } from 'react';

import { ButtonTag } from '@/component';

interface IconButtonProps {
	children: ReactNode;
	name: string;
	onClick?: () => void;
}

export default function IconButton({ children, name, onClick }: IconButtonProps) {
	const handleButtonClick = () => {
		if (onClick) {
			onClick();
		}
	};
	return (
		<ButtonTag name={name} position='bottom'>
			<button
				type='button'
				className='rounded-full p-3 transition duration-200 ease-in-out hover:bg-gray-100'
				onClick={handleButtonClick}
			>
				{children}
			</button>
		</ButtonTag>
	);
}
