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
				<Icon.Profile fill={color} height={32} width={32} />
				<div>
					<p className='max-w-[180px] truncate text-sm'>{name}</p>
					{host && <p className='text-xs text-[#5F6368]'>회의 호스트</p>}
				</div>
			</div>
			<div className='flex items-center'>
				<div className='flex size-12 items-center justify-center'>
					{isMicOn ? <Visualizer stream={stream} /> : <Icon.MicOff fill='#5F6368' height={24} width={24} />}
				</div>
				<ButtonTag name='추가 작업' position='bottom'>
					<button className='flex size-12 items-center justify-center rounded-full hover:bg-[#EFEFEF]' type='button'>
						<Icon.Menu className='rotate-90' fill='#5F6368' height={18} width={18} />
					</button>
				</ButtonTag>
			</div>
		</div>
	);
}
