import * as Icon from '@/asset/icon';
import { ButtonTag, Visualizer } from '@/component';

interface UserListCardProperties {
	name: string;
	color: string;
	host?: boolean;
	isMicOn: boolean;
	stream: MediaStream | null;
}

export default function UserListCard({ color, host, isMicOn, name, stream }: UserListCardProperties) {
	return (
		<div className='flex h-14 flex-1 items-center justify-between'>
			<div className='flex select-none items-center gap-4 bg-white font-googleSans text-[#202124]'>
				<Icon.Profile width={32} height={32} fill={color} />
				<div>
					<p className='max-w-[180px] truncate text-sm'>{name}</p>
					{host && <p className='text-xs text-[#5F6368]'>회의 호스트</p>}
				</div>
			</div>
			<div className='flex items-center'>
				<div className='flex size-12 items-center justify-center'>
					{isMicOn ? <Visualizer stream={stream} /> : <Icon.MicOff width={24} height={24} fill='#5F6368' />}
				</div>
				<ButtonTag name='추가 작업' position='bottom'>
					<button type='button' className='flex size-12 items-center justify-center rounded-full hover:bg-[#EFEFEF]'>
						<Icon.Menu width={18} height={18} fill='#5F6368' className='rotate-90' />
					</button>
				</ButtonTag>
			</div>
		</div>
	);
}
