'use client';

import { useState, useEffect } from 'react';

import MenuCard from './MenuCard';

import * as Icon from '@/asset/icon';
import { ButtonTag, Feedback, Setting } from '@/component';
import { useOutsideClick } from '@/hook';

export default function MenuButton() {
	const [isClickedButton, setIsClickedButton] = useState(false);

	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isClickedFeedback, setIsClickedFeedback] = useState(false);
	const [isClickedSetting, setIsClickedSetting] = useState(false);

	const checkFullscreen = () => document.fullscreenElement !== null;

	const enterFullscreen = () => {
		const element = document.documentElement;
		if (element.requestFullscreen) {
			element.requestFullscreen();
		}
	};

	const exitFullscreen = () => {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		}
	};

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(Boolean(checkFullscreen()));
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.addEventListener('mozfullscreenchange', handleFullscreenChange);
		document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
		document.addEventListener('msfullscreenchange', handleFullscreenChange);

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
			document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
			document.removeEventListener('msfullscreenchange', handleFullscreenChange);
		};
	}, []);

	const toggleFullscreen = () => {
		if (isFullscreen) {
			exitFullscreen();
		} else {
			enterFullscreen();
		}
		setIsClickedButton((previous) => !previous);
	};

	const handleButtonClick = () => {
		setIsClickedButton((previous) => !previous);
	};

	const handleFeebackButtonClick = () => {
		setIsClickedFeedback(true);
		setIsClickedButton(false);
	};

	const handleSettingButtonClick = () => {
		setIsClickedSetting(true);
		setIsClickedButton(false);
	};

	const handleFeedbackClose = () => {
		setIsClickedFeedback(false);
	};

	const handleSettingClose = () => {
		setIsClickedSetting(false);
	};

	const { targetRef } = useOutsideClick<HTMLDivElement>(() => {
		setIsClickedButton(false);
	});

	return (
		<div className='relative' ref={targetRef}>
			<ButtonTag name='옵션 더보기'>
				<button
					className='flex h-12 w-9 items-center justify-center rounded-full bg-[#393B3D] hover:bg-[#414345] active:bg-[#585A5C]'
					type='button'
					onClick={handleButtonClick}
				>
					<Icon.Menu className='rotate-90' fill='#E3E3E3' height={18} width={18} />
				</button>
			</ButtonTag>
			{isClickedButton && (
				<div className='absolute -top-4 right-1 w-[324px] -translate-y-full rounded-xl bg-[#1E1F20] py-2 sm:fixed sm:left-1 sm:right-auto'>
					<MenuCard
						icon={
							isFullscreen ? (
								<Icon.FullScreenOff fill='#C4C7C5' height={24} width={24} />
							) : (
								<Icon.FullScreen fill='#C4C7C5' height={24} width={24} />
							)
						}
						name={isFullscreen ? '전체화면 종료' : '전체화면'}
						onClick={toggleFullscreen}
					/>
					<hr className='my-2 w-full border-t border-[#444746]' />
					<MenuCard
						icon={<Icon.Feedback fill='#C4C7C5' height={24} width={24} />}
						name='문제 신고'
						onClick={handleFeebackButtonClick}
					/>
					<MenuCard
						icon={<Icon.Setting fill='#C4C7C5' height={24} width={24} />}
						name='설정'
						onClick={handleSettingButtonClick}
					/>
				</div>
			)}
			<Feedback isOpen={isClickedFeedback} onClose={handleFeedbackClose} />
			<Setting isOpen={isClickedSetting} onClose={handleSettingClose} />
		</div>
	);
}
