'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createRoom } from '@/app/api/room';
import * as Icon from '@/asset/icon';
import { Alert, Loading } from '@/component';

export default function AddNewMeetingButton() {
	const router = useRouter();
	const [isFailed, setIsFailed] = useState(false);
	const [isPending, setIsPending] = useState(false);

	const handleButtonClick = async () => {
		setIsPending(true);
		try {
			const { roomId: id } = await createRoom();
			router.push(`/${id}`);
		} catch {
			setIsFailed(true);
			setIsPending(false);
		}
	};

	const handleCloseAlert = () => {
		setIsFailed(false);
	};

	return (
		<>
			<button
				className='flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-[#1a73E8] px-[14px] text-base text-white hover:bg-[#1A6DDE] hover:shadow-md'
				disabled={isPending}
				type='button'
				onClick={handleButtonClick}
			>
				<Icon.AddMeeting fill='#ffffff' height={18} width={18} />새 회의
			</button>
			<Alert isOpen={isFailed} text='세션 생성에 실패하였습니다.' onCloseAlert={handleCloseAlert} />
			<Loading isPending={isPending} />
		</>
	);
}
