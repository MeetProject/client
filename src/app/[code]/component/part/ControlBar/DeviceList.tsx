'use client';

import { useShallow } from 'zustand/react/shallow';

import { DeviceButton } from '../Device';

import * as Icon from '@/asset/icon';
import { useDeviceStore } from '@/store/DeviceStore';

interface DeviceListProperties {
	type: 'audio' | 'video';
}

export default function DeviceList({ type }: DeviceListProperties) {
	const { audioInput, audioInputList, audioOutput, audioOutputList, videoInput, videoInputList } = useDeviceStore(
		useShallow((state) => ({
			audioInput: state.audioInput,
			audioInputList: state.audioInputList,
			audioOutput: state.audioOutput,
			audioOutputList: state.audioOuputList,
			stream: state.stream,
			streamStatus: state.streamStatus,
			videoInput: state.videoInput,
			videoInputList: state.videoInputList,
		})),
	);
	return (
		<div className='absolute top-0 z-50 flex -translate-y-full items-center gap-[10px] rounded-[36px] bg-[#2C2C2C] p-[10px] duration-500 md:hidden'>
			{type === 'audio' ? (
				<>
					<DeviceButton
						color='black'
						currentDevice={audioInput}
						deviceList={audioInputList}
						icon={<Icon.MicOn fill='#8AB4F8' height={14} width={14} />}
						type='audioInput'
						width={244}
					/>
					<DeviceButton
						color='black'
						currentDevice={audioOutput}
						deviceList={audioOutputList}
						icon={<Icon.Sound fill='#8AB4F8' height={14} width={14} />}
						type='audioOutput'
						width={244}
					/>
				</>
			) : (
				<DeviceButton
					color='black'
					currentDevice={videoInput}
					deviceList={videoInputList}
					icon={<Icon.VideoOn fill='#8AB4F8' height={14} width={14} />}
					type='videoInput'
					width={462}
				/>
			)}
		</div>
	);
}
