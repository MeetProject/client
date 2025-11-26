'use client';

import { MouseEvent } from 'react';

import * as Icon from '@/asset/icon';
import ButtonTag from '@/component/ButtonTag';
import { CategoryType } from '@/type/feedbackType';

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
						type='button'
						onClick={handleBackButtonClick}
						className='flex size-12 items-center justify-center rounded-full hover:bg-[#F8F8F8] active:bg-[#E9E9E9]'
					>
						<Icon.Arrow width={24} height={24} fill='#474747' />
					</button>
				</ButtonTag>
				<h1 className='text-lg text-custom-gray'>{type === 'report' ? '문제 신고' : '아이디어 제안'}</h1>
			</div>
			<ButtonTag name='닫기' position='bottom'>
				<button
					type='button'
					onClick={handleCloseButtonClick}
					className='flex size-12 items-center justify-center rounded-full hover:bg-[#F8F8F8] active:bg-[#E9E9E9]'
				>
					<Icon.Delete width={24} height={24} fill='#474747' />
				</button>
			</ButtonTag>
		</div>
	);
}
