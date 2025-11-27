import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

import * as Icon from '@/asset/icon';
import { useDevice } from '@/hook';
import { checkPermissionQuery } from '@/lib/mediaPermission';
import { useDeviceStore } from '@/store/DeviceStore';

import InitialRequestModal from './InitialRequestModal';
import Modal from './Modal';
import { AudioSetting, VideoSetting } from './part/Setting';
import RequestModal from './RequestModal';

type Category = 'audio' | 'video' | 'general';
type SettingModalState = 'loading' | 'initial-request' | 'request' | 'setting';

interface SettingProperties {
	isOpen: boolean;
	onClose: () => void;
}

interface SettingModalProperties {
	onClose: () => void;
}

interface SettingContentProperties {
	category: Category;
}

interface CategoryButtonType {
	name: string;
	value: Category;
	icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const CATEGORY_BUTTON: CategoryButtonType[] = [
	{
		icon: Icon.Speaker,
		name: '오디오',
		value: 'audio',
	},
	{
		icon: Icon.VideoOn,
		name: '비디오',
		value: 'video',
	},
];

function SettingContent({ category }: SettingContentProperties) {
	if (category === 'audio') {
		return <AudioSetting />;
	}

	return <VideoSetting />;
}

function SettingModal({ onClose }: SettingModalProperties) {
	const [category, setCategory] = useState<Category>('audio');
	const { audioOutput } = useDeviceStore(
		useShallow((state) => ({
			audioOutput: state.audioOutput,
		})),
	);
	const handleCategoryButtonClick = (value: Category) => {
		setCategory(value);
	};

	const handleDeleteButtonClick = () => {
		onClose();
	};

	useEffect(() => {
		const mediaElements = document.querySelectorAll('audio, video');
		mediaElements.forEach((element) => {
			const mediaElement = element as HTMLMediaElement;
			if (mediaElement?.setSinkId && audioOutput) {
				mediaElement.setSinkId(audioOutput.deviceId);
			}
		});
	}, [audioOutput]);

	return (
		<div
			className='relative flex h-[650px] w-[800px] rounded-lg bg-white font-googleSans'
			style={{ maxWidth: 'calc(100vw - 32px)' }}
		>
			<div className='h-full w-[256px] border-r border-solid border-[#DADCE0] md:w-20'>
				<h1 className='px-6 pt-6 text-1.5xl text-[#202124] md:hidden'>설정</h1>
				<div className='mr-2 mt-6'>
					{CATEGORY_BUTTON.map((categoryButton) => {
						const IconComponent = categoryButton.icon;
						return (
							<button
								type='button'
								key={categoryButton.value}
								onClick={() => handleCategoryButtonClick(categoryButton.value)}
								className={`group relative flex h-12 w-full items-center gap-3 rounded-r-full ${category === categoryButton.value ? 'z-10 bg-[#E8F0FE] hover:shadow-md' : 'bg-white hover:bg-[#F9F9F9]'} px-6`}
							>
								<IconComponent
									width={24}
									height={24}
									fill={category === categoryButton.value ? '#1967D2' : '#5F6368'}
									className={`group-hover:${category === categoryButton.value ? 'fill-[#174FA7]' : 'fill-[#232427]'}`}
								/>
								<p
									className={`${
										category === categoryButton.value
											? 'text-[#1967D2] group-hover:text-[#174EA6]'
											: 'text-[#5F6368] group-hover:text-[#202124]'
									} md:hidden`}
								>
									{categoryButton.name}
								</p>
							</button>
						);
					})}
				</div>
			</div>
			<button
				type='button'
				onClick={handleDeleteButtonClick}
				className='absolute right-3 top-[9px] flex size-12 items-center justify-center rounded-full hover:bg-[#F9F9F9] active:bg-[#E6E7E7]'
			>
				<Icon.Delete width={24} height={24} fill='#5F6368' />
			</button>
			<div className='flex my-6 mx-12 pt-[60px] flex-1'>
				<SettingContent category={category} />
			</div>
		</div>
	);
}

export default function Setting({ isOpen, onClose }: SettingProperties) {
	const timerReference = useRef<NodeJS.Timeout | null>(null);
	const pathname = usePathname();

	const [modalState, setModalState] = useState<SettingModalState>('loading');

	const { stream, streamStatus } = useDeviceStore(
		useShallow((state) => ({
			stream: state.stream,
			streamStatus: state.streamStatus,
		})),
	);

	const { stopStream, updateStream: handleUpdateStream } = useDevice();

	const updateStream = useCallback(async () => {
		if (timerReference.current) {
			clearTimeout(timerReference.current);
		}
		handleUpdateStream();
		if (timerReference.current) {
			clearTimeout(timerReference.current);
		}
		timerReference.current = setTimeout(() => {
			timerReference.current = null;
		}, 2000);
	}, [handleUpdateStream]);

	useEffect(() => {
		const getPermission = async () => {
			setModalState('loading');

			const permission = await checkPermissionQuery();

			if (permission === null) {
				setModalState('initial-request');
				return;
			}

			if (permission === false) {
				setModalState('request');
				return;
			}

			await updateStream();
			setModalState('setting');
		};

		if (isOpen) {
			getPermission();
		}
	}, [isOpen, updateStream]);

	useEffect(() => {
		if (stream || streamStatus === 'rejected' || streamStatus === 'failed') {
			setModalState('setting');
		}
	}, [stream, streamStatus]);

	const handleSkipUpdateStreamButtonClick = () => {
		setModalState('setting');
	};

	const handleModalClose = () => {
		setModalState('loading');
		onClose();
		if (pathname === '/landing') {
			stopStream();
		}
	};

	return (
		<Modal isOpen={isOpen} onCloseModal={handleModalClose}>
			{modalState === 'setting' ? (
				<SettingModal onClose={handleModalClose} />
			) : modalState === 'initial-request' ? (
				<InitialRequestModal />
			) : modalState === 'request' ? (
				<RequestModal onSkipUpdateStream={handleSkipUpdateStreamButtonClick} />
			) : null}
		</Modal>
	);
}
