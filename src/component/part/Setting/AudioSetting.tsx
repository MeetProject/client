import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import * as Icon from '@/asset/icon';
import { DeviceSelectBox, Visualizer } from '@/component';
import { useDevice } from '@/hook';
import { useDeviceStore } from '@/store/DeviceStore';
import { DeviceType } from '@/type/streamType';

export default function AudioSetting() {
	const audioReference = useRef<HTMLAudioElement>(null);
	const timerReference = useRef<NodeJS.Timeout | null>(null);
	const [isPlay, setIsPlay] = useState(false);

	const { changeTrack } = useDevice();

	const { audioInput, audioInputList, audioOuputList, audioOutput, permission, stream } = useDeviceStore(
		useShallow((state) => ({
			audioInput: state.audioInput,
			audioInputList: state.audioInputList,
			audioOuputList: state.audioOuputList,
			audioOutput: state.audioOutput,
			permission: state.permission,
			setAudioInput: state.setAudioInput,
			setAudioOutput: state.setAudioOutput,
			stream: state.stream,
		})),
	);

	const handleAudioChange = (device: MediaDeviceInfo, type: DeviceType) => {
		changeTrack(device, type);
	};

	const handleAudioTestButton = () => {
		if (!audioReference.current || isPlay) {
			return;
		}
		setIsPlay(true);
		audioReference.current.currentTime = 0;
		audioReference.current.play();
		timerReference.current = setTimeout(() => {
			if (audioReference.current) {
				audioReference.current.pause();
			}
			setIsPlay(false);
			timerReference.current = null;
		}, 4000);
	};

	useEffect(
		() => () => {
			if (timerReference.current) {
				clearTimeout(timerReference.current);
				timerReference.current = null;
			}
		},
		[],
	);

	return (
		<div className='flex flex-col gap-6 flex-1'>
			<div className='flex items-center sm:block gap-4'>
				<div className='min-w-[100px]' style={{ flex: '1 1 100px' }}>
					<div>
						<p className='mb-2 text-sm font-medium text-[#1A73E8]'>마이크</p>
					</div>
					<DeviceSelectBox
						DeviceIcon={Icon.MicOn}
						currentValue={audioInput}
						deviceList={audioInputList}
						disabled={permission?.audio ? false : '권한'}
						onChange={(device: MediaDeviceInfo) => handleAudioChange(device, 'audioInput')}
					/>
				</div>
				<div className='flex w-12 items-center justify-center pt-7 sm:ml-0 sm:w-full'>
					{permission?.audio && <Visualizer stream={stream} />}
				</div>
			</div>
			<div className='flex items-center sm:block gap-4'>
				<div className='min-w-[100px]' style={{ flex: '1 1 100px' }}>
					<div>
						<p className='mb-2 text-sm font-medium text-[#1A73E8]'>스피커</p>
					</div>
					<DeviceSelectBox
						DeviceIcon={Icon.Sound}
						currentValue={audioOutput}
						deviceList={audioOuputList}
						disabled={permission?.audio ? (audioOuputList.length === 0 ? '시스템' : false) : '권한'}
						onChange={(device: MediaDeviceInfo) => handleAudioChange(device, 'audioOutput')}
					/>
				</div>
				<div className='flex items-center justify-center pt-7'>
					<button
						className='h-10 w-12 rounded-full text-sm text-[#444746] hover:bg-[#ECF2FC] hover:text-[#0B57D0] active:bg-[#D5E2F7]'
						disabled={isPlay}
						type='button'
						onClick={handleAudioTestButton}
					>
						{isPlay ? '재생 중' : '테스트'}
					</button>
				</div>
			</div>
			<audio ref={audioReference} src='/audio/soundTest.mp3' />
		</div>
	);
}
