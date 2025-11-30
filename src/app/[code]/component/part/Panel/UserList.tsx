'use client';

import { useEffect, useState, useRef } from 'react';

import UserListCard from './UserListCard';

import * as Icon from '@/asset/icon';
import { charMatcher } from '@/lib/filterKeyword';
import { UserListType } from '@/type/participantType';

interface UserPanelProperties {
	filterValue?: string;
	userList: UserListType[];
}

export default function UserPanel({ filterValue, userList }: UserPanelProperties) {
	const timerReference = useRef<NodeJS.Timeout | null>(null);
	const [isOpen, setIsOpen] = useState(true);
	const [currentUser, setCurrentUser] = useState<UserListType[]>(userList);

	const handleClickButton = () => {
		setIsOpen((previous) => !previous);
	};

	useEffect(() => {
		if (timerReference.current) {
			clearTimeout(timerReference.current);
		}
		timerReference.current = setTimeout(() => {
			if (filterValue) {
				const matcher = charMatcher(filterValue.toLowerCase());
				const filteredUser = userList.filter((user) => matcher.test(user.name.toLocaleLowerCase()));
				setCurrentUser(filteredUser);
				timerReference.current = null;
				return;
			}
			setCurrentUser(userList);
			timerReference.current = null;
		}, 300);
	}, [filterValue, userList]);
	return (
		<div>
			<button
				className={`relative flex h-10 w-full items-center justify-between rounded-t-lg ${!isOpen && 'rounded-b-lg'} border border-solid border-[#DADCE0]`}
				type='button'
				onClick={handleClickButton}
			>
				<div className='flex flex-1 items-center justify-between px-5 font-googleSans text-sm text-[#202124]'>
					<p>참여자</p>
					<p className='font-medium'>{currentUser.length}</p>
				</div>
				<div className='flex size-10 items-center justify-center pr-2'>
					<Icon.Chevron
						className={`${isOpen && 'rotate-180'} stroke-[#202124] stroke-[8px] duration-150`}
						fill='#202124'
						height={12}
						width={12}
					/>
				</div>
			</button>
			{isOpen && (
				<div className='rounded-b-lg border border-t-0 border-solid border-[#DADCE0] py-2 pl-4 pr-1'>
					{currentUser.map((user) => (
						<UserListCard
							color={user.color}
							isMicOn={user.isMicOn}
							key={user.id}
							name={user.name}
							stream={user.stream}
						/>
					))}
				</div>
			)}
		</div>
	);
}
