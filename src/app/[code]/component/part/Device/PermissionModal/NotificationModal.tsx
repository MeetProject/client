import { useState } from 'react';

import { useDevice } from '@/hook';

interface NotificationModalProperties {
  onClose: () => void;
}

export default function NotificationModal({ onClose }: NotificationModalProperties) {
  const [isPending, setIsPending] = useState(false);
  const { updateStream } = useDevice();
  const handleRetryButtonClick = async () => {
    setIsPending(true);
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setIsPending(false);
      onClose();
      updateStream();
    } catch {
      setIsPending(false);
    }
  };
  return (
    <div className='rounded-[28px] bg-[#EFF3FA] font-googleSans'>
      <h2 className='px-6 pb-4 pt-6 text-2xl text-[#313131]'>Meet에서 장치를 사용할 수 없음</h2>
      <div className='px-6 pb-4'>
        <div className='mt-4 h-[60px]'>
          <ul className='list-disc pl-10 text-sm text-[#444746]'>
            <li>카메라를 사용 중일 수 있는 다른 앱을 닫으세요.</li>
            <li>외장 카메라를 사용하는 경우 연결 해제했다가 다시 연결하세요.</li>
            <li>브라우저를 종료한 후 다시 여세요</li>
          </ul>
        </div>
        <div className='mt-[10px] flex content-end justify-end gap-1 text-sm'>
          <button
            type='button'
            onClick={handleRetryButtonClick}
            disabled={isPending}
            className='my-[6px] h-9 w-[108px] rounded bg-[#1A73E8] px-6 text-white hover:bg-[#1B66C9] active:bg-[#1C58A8]'
          >
            {isPending ? '로딩 중' : '다시 시도'}
          </button>
          <button
            type='button'
            onClick={onClose}
            className='my-[5px] h-10 w-16 rounded-full px-3 text-[#0B57D0] hover:bg-[#DDE7F8] active:bg-[#C8D8F4]'
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
