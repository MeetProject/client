'use client';

import useWebRTC from '@/hook/useWebRTC/useWebRTC';
import { useState } from 'react';
import VideoPlayer from './VideoPlayer';

export default function TestPage() {
  const [value, setValue] = useState('');
  const { joinSession, createRoom, joinRoom, participantsMediaStream } = useWebRTC();
  const handleConnectButton = () => {
    joinSession();
  };

  const handleCreateRoom = () => {
    createRoom();
  };

  const handleJoinButton = async () => {
    joinRoom(value);
  };

  console.log(participantsMediaStream);

  return (
    <div>
      <div className='flex flex-1 flex-col gap-2 border'>
        <button type='button' onClick={handleConnectButton}>
          소켓 연결하기
        </button>
        <button type='button' onClick={handleCreateRoom}>
          방 생성하기
        </button>
        <div className='flex flex-1 flex-row justify-center gap-2'>
          <input className='w-60 border' value={value} onChange={(e) => setValue(e.target.value)} />
          <button type='button' onClick={handleJoinButton}>
            참여하기
          </button>
        </div>
      </div>
      <div>
        {Array.from(participantsMediaStream.entries()).map(([userId, stream]) => (
          <VideoPlayer key={userId} stream={stream} />
        ))}
        <video />
      </div>
    </div>
  );
}
