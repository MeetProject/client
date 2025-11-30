'use client';

import { useWebRTCStore } from '@/store/WebRTCStore';

const MAX_NUM = 4;

export default function EntirePeople() {
	const { participantsUserData } = useWebRTCStore();

	return (
		<div className='flex flex-col items-center justify-center pt-2'>
			<div
				className='relative flex items-center'
				style={{
					width: participantsUserData.size ? `${24 + 12 * (Math.min(participantsUserData.size, 4) - 1)}px` : '0px',
				}}
			>
				{Array.from(participantsUserData)
					.slice(0, MAX_NUM)
					.map(([userId, userData], index) => (
						<div className='relative' key={userId} style={{ left: index === 0 ? '0px' : `${-12 * index}px` }}>
							<div
								className='flex size-6 items-center justify-center truncate rounded-full text-sm font-bold text-white'
								style={{ backgroundColor: userData.profileColor }}
							>
								{userData.userName.slice(0, 3)}
							</div>
						</div>
					))}
			</div>
			{participantsUserData.size > 0 && <p className='mt-1'>{`총 ${participantsUserData.size}명`}</p>}
		</div>
	);
}
