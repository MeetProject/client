import React, { useState, MouseEvent, ReactNode } from 'react';

import ButtonTag from './ButtonTag';

import * as Icon from '@/asset/icon';
import { useOutsideClick } from '@/hook';

interface DeviceSelectBoxProperties {
	currentValue: MediaDeviceInfo;
	deviceList: MediaDeviceInfo[];
	onChange: (device: MediaDeviceInfo) => void;
	DeviceIcon: React.FC<React.SVGProps<SVGSVGElement>>;
	disabled?: boolean | '권한' | '시스템';
}

interface BoxWrapperProperties {
	children: ReactNode;
	disabled: boolean | '권한' | '시스템';
}

function BoxWrapper({ children, disabled }: BoxWrapperProperties) {
	return disabled === '권한' ? (
		<ButtonTag name='권한 필요' position='bottom'>
			{children}
		</ButtonTag>
	) : (
		children
	);
}

export default function DeviceSelectBox({
	currentValue,
	DeviceIcon,
	deviceList,
	disabled = false,
	onChange,
}: DeviceSelectBoxProperties) {
	const [isClicked, setIsClicked] = useState(false);
	const { targetRef } = useOutsideClick<HTMLDivElement>(() => {
		setIsClicked(false);
	});

	const handleSelectButtonClick = () => {
		setIsClicked((previous) => !previous);
	};

	const handleDeviceButtonClick = (e: MouseEvent<HTMLButtonElement>, device: MediaDeviceInfo) => {
		e.stopPropagation();
		onChange(device);
		setIsClicked(false);
	};

	const getLabel = () => {
		if (disabled === false) {
			return currentValue.label;
		}

		if (disabled === '권한') {
			return '권한 필요';
		}
		return '시스템 오디오';
	};

	const currentLabel = getLabel();

	return (
		<BoxWrapper disabled={disabled}>
			<div className='relative w-full' ref={targetRef}>
				<button
					className={`relative flex h-14 w-full min-w-16 items-center gap-2 truncate rounded border border-solid ${disabled ? 'border-[#E7E8E8]' : 'border-[#80868B]'} pl-[10px] pr-[25px] ${!disabled && 'hover:bg-[#F6FAFE] active:border-[#1B77E4] active:bg-[#DBE9FB]'} `}
					disabled={Boolean(disabled)}
					type='button'
					onClick={handleSelectButtonClick}
				>
					<DeviceIcon fill={disabled ? '#B5B6B7' : '#3C4043'} height={16} width={16} />
					<p className={`w-full truncate text-left ${disabled ? 'text-[#B5B6B7]' : 'text-[#3C4043]'}`}>
						{currentLabel}
					</p>
					<Icon.ChevronFill
						className='absolute right-3 top-5'
						fill={disabled ? '#B5B6B7' : '#3C4043'}
						height={18}
						width={18}
					/>
				</button>
				{isClicked && (
					<div
						className='absolute left-0 top-full z-10 max-h-[376.2px] min-w-[260px] max-w-[498.4px] rounded bg-white py-[6px]'
						style={{
							boxShadow: '0 3px 5px -1px rgba(0,0,0,.2),0 6px 10px 0 rgba(0,0,0,.14),0 1px 18px 0 rgba(0,0,0,.12)',
						}}
					>
						{deviceList.map((device) => (
							<button
								className='relative h-11 w-full truncate bg-white pl-14 pr-4 hover:bg-[#F5F5F5] active:bg-[#D7D7D7]'
								key={device.deviceId}
								type='button'
								onClick={(e) => handleDeviceButtonClick(e, device)}
							>
								<p
									className={`w-full truncate ${device.deviceId === currentValue?.deviceId ? 'text-[#1A73E8]' : 'text-black'} text-left`}
								>
									{device.label}
								</p>
								{device.deviceId === currentValue?.deviceId && (
									<Icon.Check className='absolute left-4 top-2.5 ' fill='#1A73E8' height={24} width={24} />
								)}
							</button>
						))}
					</div>
				)}
			</div>
		</BoxWrapper>
	);
}
