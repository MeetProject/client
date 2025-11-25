'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import * as Icon from '@/asset/icon';
import { Alert, Loading } from '@/component';

export default function AddNewMeetingButton() {
  const router = useRouter();
  const [isFailed, setIsFailed] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleButtonClick = async () => {
    setIsPending(true);
    try {
      const response = await fetch('http://localhost:8080/api/room/create', { method: 'POST' });
      if (!response.ok) {
        throw new Error('api Error');
      }

      const { roomId: id } = (await response.json()) as { roomId: string };
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
        type='button'
        onClick={handleButtonClick}
        disabled={isPending}
        className='flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-[#1a73E8] px-[14px] text-base text-white hover:bg-[#1A6DDE] hover:shadow-md'
      >
        <Icon.AddMeeting width={18} height={18} fill='#ffffff' />새 회의
      </button>
      <Alert text='세션 생성에 실패하였습니다.' isOpen={isFailed} onCloseAlert={handleCloseAlert} />
      <Loading isPending={isPending} />
    </>
  );
}
