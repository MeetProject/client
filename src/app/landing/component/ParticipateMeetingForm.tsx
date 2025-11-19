'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icon from '@/asset/icon';
import { Alert, Loading } from '@/component';

export default function ParticipateMeetingForm() {
  const router = useRouter();
  const [value, setValue] = useState<string>('');
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value) {
      return;
    }
    setIsPending(true);
    try {
      const roomResponse = await fetch(`http://localhost:8080/api/room/validate?roomId=${value}`);
      if (!roomResponse.ok) {
        alert('서버 오류. 다시 시도해주세요.');
        throw new Error('방 id 검사 api 오류');
      }

      const { value: isValid } = await roomResponse.json();

      if (!isValid) {
        alert('이미 닫힌 회의방입니다.');
        throw new Error('유효하지 않은 id');
      }
      router.push(`/${value}`);
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
    <form onSubmit={handleFormSubmit} className='relative flex shrink items-center gap-2'>
      <Icon.Keypad className='absolute left-4 top-1/2 -translate-y-2/4' width={22} height={16} fill='#5F6368' />
      <input
        className='max-w-[246px] shrink rounded border border-solid border-[#80868B] py-[11px] pl-12 pr-4 text-[16px] text-[#3C4043] outline-[#1B77E4]'
        placeholder='코드 또는 링크 입력'
        value={value}
        onChange={handleInputChange}
      />
      <button
        type='submit'
        className={`shrink-0 rounded px-4 py-3 text-[16px] ${value ? 'text-[#1A73E8]' : 'text-[#B5B6B7]'} ${value && 'hover:bg-[#F6FAFE]'}`}
        disabled={!value}
      >
        참여
      </button>
      <Loading isPending={isPending} />
      <Alert isOpen={isFailed} onCloseAlert={handleAlertClose} text='존재하지 않는 세션입니다.' />
    </form>
  );
}
