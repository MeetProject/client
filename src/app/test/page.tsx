'use client';

import useSignalSocket from '@/hook/useSignalSocket';

export default function TestPage() {
  const { connect } = useSignalSocket();
  const handleConnectButton = () => {
    connect();
  };
  return (
    <div className='flex flex-1 flex-col gap-2'>
      <button type='button' onClick={handleConnectButton}>
        소켓 연결하기
      </button>
      <button type='button'>join 보내기</button>
    </div>
  );
}
