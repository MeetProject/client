'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { validateRoom } from '@/app/api/room';
import { register } from '@/app/api/user';
import { Alert, Loading } from '@/component';
import { getRandomHexColor } from '@/lib/getRandomColor';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { UserRegisterPayloadType } from '@/type/participantType';

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
		const payload: UserRegisterPayloadType = {
			userColor: randomColor,
			userName: name,
		};

		try {
			const { userId } = await register(payload);
			const { value } = await validateRoom(sessionId);

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
					className='h-14 w-full rounded border border-solid border-custom-gray px-4 text-base outline-none'
					placeholder='이름'
					value={name}
					onChange={handleInputChange}
				/>
				<p className='w-full px-4 pt-1 text-right text-xs text-[#444746]'>{`${name.length} / ${MAX_SIZE}`}</p>
			</div>
			<button
				className={`mt-4 h-14 w-60 rounded-full  ${name.length ? 'bg-[#0B57D0] text-white' : 'bg-[#E4E4E4] text-[#999999]'} text-center`}
				disabled={name.length === 0 || isPending}
				type='submit'
			>
				참여하기
			</button>
			<Loading isPending={isPending} />
			<Alert isOpen={isFailed} text='세션 생성에 실패하였습니다' onCloseAlert={handleAlertClose} />
		</form>
	);
}
