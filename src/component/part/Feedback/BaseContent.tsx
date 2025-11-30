'use client';

import Image from 'next/image';
import { MouseEvent } from 'react';

import * as Icon from '@/asset/icon';
import * as image from '@/asset/image';
import { CategoryType } from '@/type/menuType';

interface BaseContentProperties {
	onClick: (value: CategoryType) => void;
	onClose: () => void;
}

interface ButtonType {
	name: string;
	icon: React.FC<React.SVGProps<SVGSVGElement>>;
	value: CategoryType;
}

const BUTTON: ButtonType[] = [
	{ icon: Icon.ReportProblem, name: '문제 신고', value: 'report' },
	{ icon: Icon.SuggestIdea, name: '아이디어 제안', value: 'suggest' },
];

export default function BaseContent({ onClick, onClose }: BaseContentProperties) {
	const handleButtonClick = (e: MouseEvent<HTMLButtonElement>, value: null | 'report' | 'suggest') => {
		e.stopPropagation();
		onClick(value);
	};

	const handleCloseButtonClick = (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		onClose();
	};

	return (
		<div className='size-full overflow-auto bg-white font-googleSans'>
			<div className='flex items-center justify-between px-5 py-2'>
				<h1 className='text-lg text-custom-gray'>의견 보내기</h1>
				<button
					className='flex size-12 items-center justify-center rounded-full'
					type='button'
					onClick={handleCloseButtonClick}
				>
					<Icon.Delete fill='#444746' height={24} width={24} />
				</button>
			</div>
			<div className='pt-4'>
				<div className='mb-5 flex justify-center'>
					<Image alt='header' height={160} src={image.feedbackHeader} width={240} />
				</div>
				{BUTTON.map((button) => {
					const ButtonIcon = button.icon;
					return (
						<button
							className='flex h-[60px] w-full items-center gap-2 rounded py-px pl-5 pr-[6px] hover:bg-[#F8F8F8] active:bg-[#E8E9E8]'
							key={button.value}
							type='button'
							onClick={(e) => handleButtonClick(e, button.value)}
						>
							<div className='flex size-7 items-center justify-center rounded-full bg-[#0B57D0]'>
								<ButtonIcon fill='#ffffff' height={18} width={18} />
							</div>
							<p className='text-[#444746]'>{button.name}</p>
						</button>
					);
				})}
			</div>
		</div>
	);
}
