import { useState } from 'react';
import { useShallow } from 'zustand/shallow';

import * as Icon from '@/asset/icon';
import { useOutsideClick, useWebRTC } from '@/hook';
import { useUserInfoStore } from '@/store/UserInfoStore';

export default function InfoMenu() {
	const { color, name, setColor, setId, setName } = useUserInfoStore(
		useShallow((state) => ({
			color: state.color,
			name: state.name,
			setColor: state.setColor,
			setId: state.setId,
			setName: state.setName,
		})),
	);
	const { leaveSession } = useWebRTC({});
	const [isOpen, setIsOpen] = useState(false);

	const handleInfoClose = () => {
		setIsOpen(false);
	};

	const { targetRef } = useOutsideClick<HTMLDivElement>(handleInfoClose);

	const handleButtonClick = () => {
		setIsOpen((prev) => !prev);
	};

	const handleLogout = () => {
		setName('');
		setColor('');
		setId('');
		leaveSession();
		setIsOpen(false);
	};

	return (
		<div className='relative'>
			<button
				className='mx-3 flex size-8 items-center justify-end truncate rounded-full font-bold text-white'
				style={{ backgroundColor: color }}
				type='button'
				onClick={handleButtonClick}
			>
				{name}
			</button>
			{isOpen && (
				<div
					className='absolute right-0 top-full flex w-[412px] -translate-x-3 translate-y-2 flex-col items-center gap-3  rounded-3xl bg-[#E9EEF6] p-4'
					ref={targetRef}
					style={{ boxShadow: '0 4px 8px 3px rgba(0, 0, 0, 0.15),0 1px 3px rgba(0, 0, 0, 0.3)' }}
				>
					<button
						className='absolute right-2 top-2 flex size-12 items-center justify-center'
						type='button'
						onClick={handleInfoClose}
					>
						<Icon.Delete fill='#444746' height={24} width={24} />
					</button>

					<div className='mx-14 my-2 mb-4 truncate text-center text-sm font-medium'>{name}</div>
					<div
						className='flex size-[104px] items-center justify-center overflow-hidden rounded-full text-3xl font-bold text-white'
						style={{ backgroundColor: color }}
					>
						{name.slice(0, 3)}
					</div>
					<div className='text-wrap text-center text-2xl font-medium'>안녕하세요, {name}님.</div>
					<button
						className='mt-2 flex w-full items-center justify-center gap-3 rounded-full bg-[#F8FAFD] py-4 text-lg text-custom-gray'
						type='button'
						onClick={handleLogout}
					>
						<Icon.Logout fill='#444746' height={18} width={18} />
						로그아웃
					</button>
				</div>
			)}
		</div>
	);
}
