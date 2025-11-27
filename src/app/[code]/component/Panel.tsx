'use client';

import { useContext } from 'react';

import * as Icon from '@/asset/icon';
import { ButtonTag } from '@/component';
import { PanelContext } from '@/context/PanelContext';
import { useWebRTCStore } from '@/store/WebRTCStore';
import { PanelType } from '@/type/menuType';
import { UserListType } from '@/type/participantType';
import { ChatType } from '@/type/reactionType';

import { UserPanel, InfoPanel, ChatPanel } from './part/Panel';

interface PanelProperties {
	userList: UserListType[];
	chatList: ChatType[];
	onSendMessage: (value: string) => void;
}

interface CurrentPanelProperties {
	type: PanelType;
	userList: UserListType[];
	chatList: ChatType[];
	onSendMessage: (value: string) => void;
}

const PANEL_TITLE = {
	ACTIVE: '활동',
	CHAT: '회의 중 메시지',
	HOST: '호스트 제어 기능',
	INFO: '회의 세부정보',
	USER: '사용자',
};

function CurrentPanel({ chatList, onSendMessage, type, userList }: CurrentPanelProperties) {
	if (type === 'USER') {
		return <UserPanel userList={userList} />;
	}
	if (type === 'INFO') {
		return <InfoPanel />;
	}
	if (type === 'CHAT') {
		return <ChatPanel chatList={chatList} onSendMessage={onSendMessage} />;
	}
	return <div>{type}</div>;
}

export default function Panel({ chatList, onSendMessage, userList }: PanelProperties) {
	const { handleOpenStatus, handlePanelType, isOpen, panelType } = useContext(PanelContext);

	const handleClickDeleteButton = () => {
		handlePanelType(null);
	};

	const handlePanelAnimationEnd = () => {
		if (panelType === null) {
			handleOpenStatus(false);
		}
	};

	console.log(chatList, useWebRTCStore.getState().participantsUserData);

	return (
		<div className='h-full select-none'>
			{isOpen && (
				<div
					className={`ml-4 h-full w-[368px] origin-top-right animate-slide-in-left rounded-lg bg-white ${panelType === null && 'animate-slide-out-left'}`}
					onAnimationEnd={handlePanelAnimationEnd}
				>
					{panelType && (
						<div className='flex size-full flex-col font-googleSans'>
							<div className='relative flex h-16 items-center px-6 py-3 text-lg text-[#202124]'>
								<p>{PANEL_TITLE[panelType]}</p>
								<div className='absolute right-3 top-1/2 size-12 -translate-y-1/2'>
									<ButtonTag name='닫기' position='bottom'>
										<button
											type='button'
											onClick={handleClickDeleteButton}
											className='flex size-12 items-center justify-center rounded-full hover:bg-[#F0F1F1] active:bg-[#DEE0DF]'
										>
											<Icon.Delete width={24} height={24} fill='#444746' />
										</button>
									</ButtonTag>
								</div>
							</div>
							<CurrentPanel type={panelType} userList={userList} chatList={chatList} onSendMessage={onSendMessage} />
						</div>
					)}
				</div>
			)}
		</div>
	);
}
