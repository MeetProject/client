'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Alert, Loading } from '@/component';
import { getRandomHexColor } from '@/lib/getRandomColor';
import { useUserInfoStore } from '@/store/UserInfoStore';

const MAX_SIZE = 60;

export default function NameForm() {
	const [isPending, setIsPending] = useState(false);
	const [name, setName] = useState('');
	const [isFailed, setIsFailed] = useState(false);
	const {
		setColor: setUserColor,
		setId,
		setName: setUserName,
	} = useUserInfoStore(
		useShallow((state) => ({
			setColor: state.setColor,
			setId: state.setId,
			setName: state.setName,
		})),
	);
	const sessionId = usePathname().slice(1);
	const router = useRouter();

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.slice(0, MAX_SIZE);
		setName(value);
	};

	const handleFromSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!name) {
			return;
		}

		setIsPending(true);

		const randomColor = getRandomHexColor();

		try {
			const payload = {
				userColor: randomColor,
				userName: name,
			};

			const response = await fetch('http://localhost:8080/api/user/register', {
				body: JSON.stringify(payload),
				headers: {
					'Content-Type': 'application/json',
				},
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('회원 등록 실패');
			}

			const { userId } = await response.json();

			const roomResponse = await fetch(`http://localhost:8080/api/room/validate?roomId=${sessionId}`);
			if (!roomResponse.ok) {
				throw new Error('방 id 검사 api 오류');
			}

			const { value } = await roomResponse.json();

			if (!value) {
				alert('이미 닫힌 회의방입니다.');
				router.push('/');
				return;
			}

			setId(userId);
			setUserName(name);
			setUserColor(randomColor);
		} catch (error) {
			console.log(error.message);
		}
	};

	const handleAlertClose = () => {
		setIsFailed(false);
	};
	return (
		<form className='flex w-full max-w-[300px] flex-col items-center justify-center' onSubmit={handleFromSubmit}>
			<div className='w-full pb-[5px] pt-5 font-googleSans'>
				<input
					value={name}
					onChange={handleInputChange}
					placeholder='이름'
					className='h-14 w-full rounded border border-solid border-custom-gray px-4 text-base outline-none'
				/>
				<p className='w-full px-4 pt-1 text-right text-xs text-[#444746]'>{`${name.length} / ${MAX_SIZE}`}</p>
			</div>
			<button
				type='submit'
				className={`mt-4 h-14 w-60 rounded-full  ${name.length ? 'bg-[#0B57D0] text-white' : 'bg-[#E4E4E4] text-[#999999]'} text-center`}
				disabled={name.length === 0 || isPending}
			>
				참여하기
			</button>
			<Loading isPending={isPending} />
			<Alert isOpen={isFailed} onCloseAlert={handleAlertClose} text='세션 생성에 실패하였습니다' />
		</form>
	);
}
