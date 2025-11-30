'use client';

import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useState } from 'react';

import { validateRoom } from '@/app/api/room';
import * as Icon from '@/asset/icon';
import { Alert, Loading } from '@/component';

export default function ParticipateMeetingForm() {
	const router = useRouter();
	const [roomId, setRoomId] = useState<string>('');
	const [isPending, setIsPending] = useState<boolean>(false);
	const [isFailed, setIsFailed] = useState<boolean>(false);

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		setRoomId(e.target.value);
	};

	const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!roomId) {
			return;
		}
		setIsPending(true);
		try {
			const { value: isValid } = await validateRoom(roomId);

			if (!isValid) {
				alert('이미 닫힌 회의방입니다.');
				throw new Error('유효하지 않은 id');
			}
			router.push(`/${roomId}`);
		} catch {
			setIsFailed(true);
		} finally {
			setIsPending(false);
		}
	};

	const handleAlertClose = () => {
		setIsFailed(false);
	};

	return (
		<form className='relative flex shrink items-center gap-2' onSubmit={handleFormSubmit}>
			<Icon.Keypad className='absolute left-4 top-1/2 -translate-y-2/4' fill='#5F6368' height={16} width={22} />
			<input
				className='max-w-[246px] shrink rounded border border-solid border-[#80868B] py-[11px] pl-12 pr-4 text-[16px] text-[#3C4043] outline-[#1B77E4]'
				placeholder='코드 또는 링크 입력'
				value={roomId}
				onChange={handleInputChange}
			/>
			<button
				className={`shrink-0 rounded px-4 py-3 text-[16px] ${roomId ? 'text-[#1A73E8]' : 'text-[#B5B6B7]'} ${roomId && 'hover:bg-[#F6FAFE]'}`}
				disabled={!roomId}
				type='submit'
			>
				참여
			</button>
			<Loading isPending={isPending} />
			<Alert isOpen={isFailed} text='존재하지 않는 세션입니다.' onCloseAlert={handleAlertClose} />
		</form>
	);
}
