import { memo } from 'react';

import { formatTime } from '@/lib/date';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { ChatType } from '@/type/reactionType';

interface MessageProperties {
	chat: ChatType;
}

function Message({ chat }: MessageProperties) {
	const id = useUserInfoStore((state) => state.id);
	return (
		<div className={`${chat.header ? 'mt-6' : 'mt-1'} mx-3 px-4 text-[13px] text-[#202124]`}>
			{chat.header && (
				<div className='flex items-center gap-2'>
					<p className='max-w-56 truncate font-bold'>{chat.userId === id ? '나' : chat.userName}</p>
					<p className='text-xs text-[#5F6368]'>{formatTime(chat.timestamp)}</p>
				</div>
			)}
			<div className='mt-1'>{chat.message}</div>
		</div>
	);
}

export const ChatMessage = memo(Message);
