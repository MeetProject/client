'use client';

import { ReactNode, useContext } from 'react';

import { ButtonTag } from '@/component';
import { PanelContext } from '@/context/PanelContext';
import { PanelType } from '@/type/menuType';

interface IconButtonProperties {
	icon: ReactNode;
	clickedIcon: ReactNode;
	type: PanelType;
	name: string;
	align?: 'left' | 'center' | 'right';
}

export default function IconButton({ align = 'center', clickedIcon, icon, name, type }: IconButtonProperties) {
	const { handleOpenStatus, handlePanelType, panelType } = useContext(PanelContext);
	const handleButtonClick = () => {
		if (panelType === type) {
			handlePanelType(null);
			return;
		}
		handlePanelType(type);
		handleOpenStatus(true);
	};

	return (
		<ButtonTag name={name} align={align}>
			<button
				type='button'
				onClick={handleButtonClick}
				className='flex size-12 items-center justify-center rounded-full bg-[#202124] hover:bg-[#2F3033]'
			>
				{panelType !== type ? icon : clickedIcon}
			</button>
		</ButtonTag>
	);
}
