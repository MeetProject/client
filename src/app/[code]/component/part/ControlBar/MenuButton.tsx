'use client';

import { useState, useEffect } from 'react';

import * as Icon from '@/asset/icon';
import { ButtonTag, Feedback, Setting } from '@/component';
import { useOutsideClick } from '@/hook';

import MenuCard from './MenuCard';

export default function MenuButton() {
	const [isClickedButton, setIsClickedButton] = useState(false);

	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isClickedFeedback, setIsClickedFeedback] = useState(false);
	const [isClickedSetting, setIsClickedSetting] = useState(false);

	const checkFullscreen = () => {
		return document.fullscreenElement !== null;
	};

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
					type='button'
					onClick={handleButtonClick}
					className='flex h-12 w-9 items-center justify-center rounded-full bg-[#393B3D] hover:bg-[#414345] active:bg-[#585A5C]'
				>
					<Icon.Menu width={18} height={18} fill='#E3E3E3' className='rotate-90' />
				</button>
			</ButtonTag>
			{isClickedButton && (
				<div className='absolute -top-4 right-1 w-[324px] -translate-y-full rounded-xl bg-[#1E1F20] py-2 sm:fixed sm:left-1 sm:right-auto'>
					<MenuCard
						icon={
							isFullscreen ? (
								<Icon.FullScreenOff width={24} height={24} fill='#C4C7C5' />
							) : (
								<Icon.FullScreen width={24} height={24} fill='#C4C7C5' />
							)
						}
						onClick={toggleFullscreen}
						name={isFullscreen ? '전체화면 종료' : '전체화면'}
					/>
					<hr className='my-2 w-full border-t border-[#444746]' />
					<MenuCard
						icon={<Icon.Feedback width={24} height={24} fill='#C4C7C5' />}
						onClick={handleFeebackButtonClick}
						name='문제 신고'
					/>
					<MenuCard
						icon={<Icon.Setting width={24} height={24} fill='#C4C7C5' />}
						onClick={handleSettingButtonClick}
						name='설정'
					/>
				</div>
			)}
			<Feedback isOpen={isClickedFeedback} onClose={handleFeedbackClose} />
			<Setting isOpen={isClickedSetting} onClose={handleSettingClose} />
		</div>
	);
}
