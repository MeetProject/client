'use client';

import { MouseEvent } from 'react';

import * as Icon from '@/asset/icon';
import ButtonTag from '@/component/ButtonTag';
import { CategoryType } from '@/type/menuType';

interface HeaderProperties {
	type: CategoryType;
	onClick: (value: CategoryType) => void;
	onClose: () => void;
}

export default function Header({ onClick, onClose, type }: HeaderProperties) {
	const handleBackButtonClick = (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		onClick(null);
	};

	const handleCloseButtonClick = (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		onClose();
	};

	return (
		<div
			className='flex h-[60px] items-center justify-between pb-1 pl-1 pr-3 pt-2 font-googleSans '
			style={{ boxShadow: '0 1px 4px rgba(48,48,48,.3)' }}
		>
			<div className='flex items-center justify-center'>
				<ButtonTag name='뒤로' position='bottom'>
					<button
						className='flex size-12 items-center justify-center rounded-full hover:bg-[#F8F8F8] active:bg-[#E9E9E9]'
						type='button'
						onClick={handleBackButtonClick}
					>
						<Icon.Arrow fill='#474747' height={24} width={24} />
					</button>
				</ButtonTag>
				<h1 className='text-lg text-custom-gray'>{type === 'report' ? '문제 신고' : '아이디어 제안'}</h1>
			</div>
			<ButtonTag name='닫기' position='bottom'>
				<button
					className='flex size-12 items-center justify-center rounded-full hover:bg-[#F8F8F8] active:bg-[#E9E9E9]'
					type='button'
					onClick={handleCloseButtonClick}
				>
					<Icon.Delete fill='#474747' height={24} width={24} />
				</button>
			</ButtonTag>
		</div>
	);
}
