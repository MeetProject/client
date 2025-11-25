'use client';

import { useState } from 'react';

import * as Icon from '@/asset/icon';
import { Alert } from '@/component';

export default function InfoPanel() {
  const [isClickedClipboardButton, setIsClickedClipboardButton] = useState(false);
  const handleClipboardButtonClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsClickedClipboardButton(true);
  };

  const handleCloseAlert = () => {
    setIsClickedClipboardButton(false);
  };

  return (
    <div style={{ height: 'calc(100% - 64px)' }} className='w-full overflow-auto font-googleSans text-[14px]'>
      <div className='px-6'>
        <p className='my-2 pt-2  font-medium text-black-87 '>참여 정보</p>
        <p className=' select-text text-[#5f5368]'>{window.location.href}</p>
      </div>
      <button
        type='button'
        onClick={handleClipboardButtonClick}
        className='mx-4 my-1 flex h-10 items-center gap-2 rounded-full px-3 py-px hover:bg-[#ECF2FC] active:bg-[#D5E2F8]'
      >
        <Icon.Clipboard width={18} height={18} fill='#0B57D0' />
        <p className='font-medium text-[#0B57D0]'>참여 정보 복사</p>
      </button>
      <div className='my-[7px] h-0 w-full border-t border-solid border-[#DADCE0]' />
      <div className='mb-[90px] px-6 py-4 text-[#5F6368] '>Project Calendar 첨부파일이 여기에 표시됩니다.</div>
      <Alert text='회의 링크 복사됨' isOpen={isClickedClipboardButton} onCloseAlert={handleCloseAlert} />
    </div>
  );
}
