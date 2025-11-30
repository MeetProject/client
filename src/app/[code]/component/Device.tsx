'use client';

import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { PermissionModal, VideoNotification, DeviceButton } from './part/Device';

import * as Icon from '@/asset/icon';
import { Visualizer } from '@/component';
import { useDevice } from '@/hook';
import { useDeviceStore } from '@/store/DeviceStore';

export default function Device() {
	const videoReference = useRef<HTMLVideoElement>(null);
	const isRender = useRef(false);

	const {
		audioInput,
		audioInputList,
		audioOutput,
		audioOutputList,
		deviceEnable,
		permission,
		videoInput,
		videoInputList,
	} = useDeviceStore(
		useShallow((state) => ({
			audioInput: state.audioInput,
			audioInputList: state.audioInputList,
			audioOutput: state.audioOutput,
			audioOutputList: state.audioOuputList,
			deviceEnable: state.deviceEnable,
			permission: state.permission,
			videoInput: state.videoInput,
			videoInputList: state.videoInputList,
		})),
	);

	const { stream } = useDeviceStore(
		useShallow((state) => ({
			stream: state.stream,
		})),
	);

	const { toggleAudioInput, toggleVideoInput, updateStream } = useDevice();
	const { streamStatus } = useDeviceStore(
		useShallow((state) => ({
			streamStatus: state.streamStatus,
		})),
	);

	const [isOpenModal, setIsOpenModal] = useState(false);
	const audioDisabled = streamStatus === 'rejected' || (permission && !permission.audio);
	const videoDisabled = streamStatus === 'rejected' || (permission && !permission.video);

	useEffect(() => {
		if (stream && videoReference.current) {
			videoReference.current.srcObject = stream;
		}
	}, [stream]);

	const handleMicButton = () => {
		if (stream && !audioDisabled) {
			toggleAudioInput();
		}
		if (audioDisabled) {
			setIsOpenModal(true);
		}
	};

	const handleVideoButton = () => {
		if (stream && !videoDisabled) {
			toggleVideoInput();
		}
		if (videoDisabled) {
			setIsOpenModal(true);
		}
	};

	const handleVideoButtonClick = () => {
		setIsOpenModal(true);
	};

	const handleModalClose = () => {
		setIsOpenModal(false);
	};

	useEffect(() => {
		if (!isRender.current) {
			isRender.current = true;
			updateStream();
		}
	}, [updateStream]);

	return (
		<div className='w-full max-w-[764px] p-4 pr-2 lg:h-[284px] lg:pr-4'>
			<div
				className='relative aspect-video size-full overflow-hidden rounded-lg'
				style={{
					boxShadow: '0 1px 2px 0 rgba(60, 64, 67, .3), 0 1px 3px 1px rgba(60, 64, 67, .15)',
				}}
			>
				<video
					autoPlay={true}
					className='aspect-video size-full object-cover'
					ref={videoReference}
					style={{ transform: 'rotateY(180deg)' }}
				/>
				<VideoNotification onClickButton={handleVideoButtonClick} />
				{deviceEnable.audio && permission?.audio && (
					<div className='absolute bottom-4 left-4'>
						<Visualizer stream={stream} />
					</div>
				)}

				<div className='absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-6 px-3'>
					{streamStatus !== null && (
						<button
							className={`relative flex items-center justify-center border border-solid shadow-sm ${deviceEnable.audio && permission?.audio ? 'border-white' : 'border-[#EA4335] bg-[#EA4335]'} size-14 rounded-full`}
							type='button'
							onClick={handleMicButton}
						>
							{deviceEnable.audio && permission?.audio ? (
								<Icon.MicOn fill='#ffffff' height={24} width={24} />
							) : (
								<Icon.MicOff fill='#ffffff' height={24} width={24} />
							)}
							{audioDisabled && (
								<div className='absolute right-0 top-0 size-3 rounded-full bg-white'>
									<Icon.Warn className='relative -left-1 -top-1' fill='#FA7B17' height={20} width={20} />
								</div>
							)}
						</button>
					)}

					{streamStatus !== null && (
						<button
							className={`relative flex items-center justify-center border border-solid shadow-sm ${permission?.video ? 'border-white' : 'border-[#EA4335] bg-[#EA4335]'} size-14 rounded-full`}
							type='button'
							onClick={handleVideoButton}
						>
							{deviceEnable.video && permission?.video ? (
								<Icon.VideoOn fill='#ffffff' height={24} width={24} />
							) : (
								<Icon.VideoOff fill='#ffffff' height={24} width={24} />
							)}
							{videoDisabled && (
								<div className='absolute right-0 top-0 size-3 rounded-full bg-white'>
									<Icon.Warn className='relative -left-1 -top-1' fill='#FA7B17' height={20} width={20} />
								</div>
							)}
						</button>
					)}
				</div>
			</div>
			<div className='mt-4 flex h-9 w-full items-center gap-1 lg:hidden'>
				{streamStatus !== null && (
					<DeviceButton
						currentDevice={audioInput}
						deviceList={audioInputList}
						icon={
							<Icon.MicOn
								fill={
									(streamStatus === 'failed' && !audioInput?.deviceId) ||
									streamStatus === 'rejected' ||
									(permission && !permission.audio)
										? '#B5B6B7'
										: '#5F6368'
								}
								height={14}
								width={14}
							/>
						}
						type='audioInput'
					/>
				)}

				{streamStatus !== null && (
					<DeviceButton
						currentDevice={audioOutput}
						deviceList={audioOutputList}
						icon={
							<Icon.Sound
								fill={
									(streamStatus === 'failed' && !audioOutput?.deviceId) ||
									streamStatus === 'rejected' ||
									(permission && !permission.audio)
										? '#B5B6B7'
										: '#5F6368'
								}
								height={14}
								width={14}
							/>
						}
						type='audioOutput'
					/>
				)}

				{streamStatus !== null && (
					<DeviceButton
						currentDevice={videoInput}
						deviceList={videoInputList}
						icon={
							<Icon.VideoOn
								fill={
									streamStatus === 'failed' || streamStatus === 'rejected' || (permission && !permission.video)
										? '#B5B6B7'
										: '#5F6368'
								}
								height={14}
								width={14}
							/>
						}
						type='videoInput'
					/>
				)}
			</div>
			<PermissionModal isOpenModal={isOpenModal} onClose={handleModalClose} />
		</div>
	);
}
