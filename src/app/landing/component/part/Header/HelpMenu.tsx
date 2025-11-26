import { useState } from 'react';

import * as Icon from '@/asset/icon';
import { useOutsideClick } from '@/hook';

import IconButton from './IconButton';

const HELP_URL = 'https://github.com/armd482/meetproejct';

const HELP_BUTTON = [
	{ href: HELP_URL, name: '도움말' },
	{ href: HELP_URL, name: '교육' },
	{ href: HELP_URL, name: '서비스 약관' },
	{ href: HELP_URL, name: '개인정보처리방침' },
	{ href: HELP_URL, name: '약관 요약' },
];

export default function HelpMenu() {
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const handleHelpClose = () => {
		setIsOpen(false);
	};

	const { targetRef } = useOutsideClick<HTMLDivElement>(handleHelpClose);

	const handleButtonClick = () => {
		setIsOpen((prev) => !prev);
	};

	const handleHelpButtonClick = (href: string) => {
		window.open(href, '_blank');
		setIsOpen(false);
	};

	return (
		<div className='relative'>
			<IconButton name='지원' onClick={handleButtonClick}>
				<Icon.Help fill='#5f6368' height={24} width={24} />
			</IconButton>

			{isOpen && (
				<div
					ref={targetRef}
					className='absolute top-12 right-0 z-[5] w-[280px] rounded bg-white py-2'
					style={{
						boxShadow: '0 3px 5px -1px rgba(0,0,0,.2),0 6px 10px 0 rgba(0,0,0,.14),0 1px 18px 0 rgba(0,0,0,.12)',
					}}
				>
					{HELP_BUTTON.map((button) => (
						<button
							key={button.name}
							type='button'
							onClick={() => handleHelpButtonClick(button.href)}
							className='flex h-12 w-full items-center justify-center px-4 text-black hover:bg-[#F5F5F5] active:bg-[#D7D7D7]'
						>
							{button.name}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
