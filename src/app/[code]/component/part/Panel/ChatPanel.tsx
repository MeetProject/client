'use client';

import { ChangeEvent, FormEvent, useRef, useState } from 'react';

import * as Icon from '@/asset/icon';
import { ChatType } from '@/type/reactionType';

import { ChatMessage } from './ChatMessage';

interface ChatPanelProperties {
  chatList: ChatType[];
  onSendMessage: (value: string) => void;
}

export default function ChatPanel({ chatList, onSendMessage }: ChatPanelProperties) {
  const textReference = useRef<HTMLTextAreaElement>(null);
  const [chat, setChat] = useState('');
  const handleInputChage = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setChat(e.target.value);

    if (!textReference.current) {
      return;
    }
    textReference.current.style.height = 'auto';
    textReference.current.style.height = `${textReference.current.scrollHeight}px`;
  };

  const handleFormSubmt = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chat) {
      return;
    }
    onSendMessage(chat);
    setChat('');
  };

  return (
    <div className='flex flex-1 flex-col'>
      <div className='m-3 rounded bg-[#F1F3F4] p-3 text-center text-xs text-[#202124]'>
        메시지는 고정되어 있지 않는 한, 메시지를 전송하면 통화 중인 사람에게만 표시됩니다. 통화가 끝나면 모든 메시지가
        삭제됩니다.
      </div>
      <div className='w-full flex-1 pb-2'>
        {chatList.map((message) => (
          <ChatMessage key={message.id} chat={message} />
        ))}
      </div>
      <form className='relative m-[15px] flex items-center rounded-[25px] bg-[#F1F3F4] py-1' onSubmit={handleFormSubmt}>
        <textarea
          ref={textReference}
          placeholder='메세지 보내기'
          onChange={handleInputChage}
          value={chat}
          rows={1}
          className='max-h-32 flex-1 resize-none bg-transparent px-4 outline-none'
        />
        <button type='submit' className='flex size-10 items-center justify-center' disabled={Boolean(!chat)}>
          <Icon.Submit width={24} height={24} fill={chat ? '#1A73E8' : '#ACAFB0'} />
        </button>
      </form>
    </div>
  );
}
