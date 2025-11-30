'use client';

import { ReactNode, useState, MouseEvent, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

import DeviceList from './DeviceList';

import * as Icon from '@/asset/icon';
import { ButtonTag } from '@/component';
import { useOutsideClick, useShortcutKey } from '@/hook';
import { useDeviceStore } from '@/store/DeviceStore';

interface OptionButtonProperties {
	type: 'audio' | 'video';
	onClickButton?: (type: 'audio' | 'video') => void;
	onClickChevron?: (isClicked: boolean) => void;
	clickedIcon: ReactNode;
	icon: ReactNode;
	name: Record<'chevron' | 'iconOn' | 'iconOff', string>;
	shortcutKey?: string[];
}

export default function OptionButton({
	clickedIcon,
	icon,
	name,
	onClickButton,
	onClickChevron,
	shortcutKey,
	type,
}: OptionButtonProperties) {
	const { audioInput, deviceEnable, permission, streamStatus, videoInput } = useDeviceStore(
		useShallow((state) => ({
			audioInput: state.audioInput,
			deviceEnable: state.deviceEnable,
			permission: state.permission,
			streamStatus: state.streamStatus,
			videoInput: state.videoInput,
		})),
	);

	const [isPending, setIsPending] = useState(false);
	const [isClickedChevron, setIsClickedChevron] = useState(false);
	const [currentHover, setCurrentHover] = useState<'chevron' | 'iconOn' | 'iconOff'>('chevron');

	const audioDisabled = !audioInput?.deviceId;
	const videoDisabled = !videoInput?.deviceId || streamStatus === 'rejected' || (permission && !permission.video);

	const isDisabled = type === 'audio' ? audioDisabled : videoDisabled;

	const { targetRef } = useOutsideClick<HTMLDivElement>(() => {
		setIsClickedChevron(false);
	});

	const handleButtonClick = useCallback(async () => {
		setIsPending(true);
		onClickButton?.(type);

		setIsPending(false);
	}, [onClickButton, type]);

	const handleChevronClick = () => {
		setIsClickedChevron((previous) => {
			if (onClickChevron) {
				onClickChevron(!previous);
			}
			return !previous;
		});
	};

	const handleButtonMouseEnter = () => {
		setCurrentHover(deviceEnable[type] ? 'iconOn' : 'iconOff');
	};

	const handleChevronMouseEnter = (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		setCurrentHover('chevron');
	};

	useShortcutKey(shortcutKey ?? [], handleButtonClick);

	return (
		<div className='z-30' ref={targetRef}>
			<ButtonTag
				align={name.chevron !== '영상 설정' || currentHover !== 'chevron' ? 'left' : 'center'}
				name={name[currentHover]}
			>
				<div
					className={`relative flex h-12 w-[88px] items-center ${deviceEnable[type] ? 'rounded-[26px]' : 'rounded-xl'} ${deviceEnable[type] ? 'bg-[#282A2C] hover:bg-[#2D2F31] active:bg-[#3B3D3F]' : 'bg-[#5F1312] hover:bg-[#641B1A] active:bg-[#6E2B2A]'} duration-150 md:w-12`}
				>
					<button
						className='flex size-12 items-center justify-center pl-1 md:hidden'
						disabled={isPending}
						type='button'
						onClick={handleChevronClick}
						onMouseEnter={handleChevronMouseEnter}
					>
						<Icon.Chevron
							className={`${!isClickedChevron && 'rotate-180'} duration-75`}
							fill={deviceEnable[type] && !isDisabled ? '#8E918F' : '#F9DEDC'}
							height={10}
							width={10}
						/>
					</button>
					<button
						className={` flex items-center justify-center ${deviceEnable[type] && !isDisabled ? 'rounded-full bg-[#333537] hover:bg-[#414345]' : 'rounded-xl bg-[#F9DEDC]'} size-12 duration-150`}
						type='button'
						onClick={handleButtonClick}
						onMouseEnter={handleButtonMouseEnter}
					>
						<div className='delay-150'>{deviceEnable[type] && !isDisabled ? icon : clickedIcon}</div>
					</button>
					{isDisabled && (
						<div className='absolute right-0 top-0 size-3 rounded-full bg-black'>
							<Icon.Warn className='relative -left-1 -top-1' fill='#FFE07C' height={20} width={20} />
						</div>
					)}
				</div>
			</ButtonTag>
			{isClickedChevron && <DeviceList type={type} />}
		</div>
	);
}
