'use client';

import useSignalSocket from '@/hook/useSignalSocket';

export default function TestPage() {
  const { connect, sendJoin, offerSDP } = useSignalSocket();
  const handleConnectButton = () => {
    connect();
  };

  const handleJoinButton = async () => {
    sendJoin('test');
  };
  return (
    <div className='flex flex-1 flex-col gap-2'>
      <button type='button' onClick={handleConnectButton}>
        소켓 연결하기
      </button>
      <button type='button' onClick={handleJoinButton}>
        join 보내기
      </button>
      <button type='button' onClick={() => offerSDP('test', 'test')}>
        offer 보내기
      </button>
    </div>
  );
}
