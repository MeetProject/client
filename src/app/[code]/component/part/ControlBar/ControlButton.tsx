'use client';

import { ReactNode, useCallback, useContext } from 'react';

import { ButtonTag } from '@/component';
import { ToggleContext } from '@/context/ToggleContext';
import { useShortcutKey } from '@/hook';
import { ToggleType } from '@/type/menuType';

interface ControlButtonProperties {
	icon: ReactNode;
	clickedIcon: ReactNode;
	disabledIcon?: ReactNode;
	name: string;
	type: ToggleType;
	onClick?: (value: boolean | 'disable') => void;
	shortcutKey?: string[];
	hidden?: boolean;
	disabled?: boolean;
}

export default function ControlButton({
	clickedIcon,
	disabled = false,
	disabledIcon,
	hidden = false,
	icon,
	name,
	onClick,
	shortcutKey,
	type,
}: ControlButtonProperties) {
	const { handleToggleStatus, toggleStatus } = useContext(ToggleContext);
	const isClickedButton = toggleStatus[type];

	const handleButtonClick = useCallback(() => {
		if (onClick) {
			onClick(typeof isClickedButton === 'boolean' ? !isClickedButton : 'disable');
		}
		if (isClickedButton !== 'disable') {
			handleToggleStatus(type);
		}
	}, [type, isClickedButton, handleToggleStatus, onClick]);

	useShortcutKey(shortcutKey ?? [], handleButtonClick);

	return (
		<div className={`${hidden && 'hidden'} sm:hidden`}>
			<ButtonTag name={name}>
				<button
					type='button'
					onClick={handleButtonClick}
					disabled={disabled}
					className={`flex h-12 w-14 items-center justify-center ${isClickedButton === 'disable' ? 'rounded-xl bg-[#491619]' : isClickedButton ? 'rounded-xl bg-[#A8C8F8] hover:bg-[#9BBCEE] active:bg-[#A4C1ED]' : 'rounded-[26px] bg-[#333537] hover:bg-[#414345] active:bg-[#555758]'} duration-150`}
				>
					{disabledIcon && isClickedButton === 'disable' ? disabledIcon : isClickedButton === true ? icon : clickedIcon}
				</button>
			</ButtonTag>
		</div>
	);
}
