'use client';

import * as Icon from '@/asset/icon';

interface DeviceCardProperties {
	device: MediaDeviceInfo;
	onClick: (device: MediaDeviceInfo) => void;
	isChoosed: boolean;
	color: 'black' | 'white';
}

export default function DeviceCard({ color, device, isChoosed, onClick }: DeviceCardProperties) {
	const handleButtonClick = () => {
		onClick(device);
	};

	return (
		<button
			type='button'
			className={`relative flex h-10 w-[320px] items-center pl-14 pr-4 ${color === 'black' ? 'hover:bg-[#37383B] active:bg-[#494A4D]' : 'hover:bg-[#F5F5F5] active:bg-[#D7D7D7]'} `}
			onClick={handleButtonClick}
		>
			<div
				className={`truncate text-sm ${isChoosed ? (color === 'black' ? 'text-[#8AB4F8]' : 'text-[#1A73E8]') : color === 'black' ? 'text-white' : 'text-black'}`}
			>
				{device.label}
			</div>
			{isChoosed && (
				<div className='absolute left-4 top-1/2 -translate-y-1/2'>
					<Icon.Check width={24} height={24} fill={color === 'black' ? '#8AB4F8' : '#1A73E8'} />
				</div>
			)}
		</button>
	);
}
