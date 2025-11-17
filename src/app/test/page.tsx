'use client';

import useWebRTC from '@/hook/useWebRTC/useWebRTC';
import { useState } from 'react';
import VideoPlayer from './VideoPlayer';

export default function TestPage() {
  const [value, setValue] = useState('');
  const {
    joinSession,
    createRoom,
    joinRoom,
    leaveRoom,
    leaveSession,
    shareScreen,
    stopShareScreen,
    participantsMediaStream,
    screenSharingMediaStream,
  } = useWebRTC({});
  const handleConnectButton = async () => {
    await joinSession();
  };

  const handleCreateRoom = async () => {
    await createRoom();
  };

  const handleJoinButton = async () => {
    joinRoom(value.slice(1, value.length - 1));
  };

  const handleLeaveButton = () => {
    leaveRoom();
  };

  const handleDisconnectButton = () => {
    leaveSession();
  };

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
        <div className='flex gap-2'>
          <button type='button' onClick={shareScreen}>
            화면 공유하기
          </button>
          <button type='button' onClick={stopShareScreen}>
            화면 공유하기
          </button>
        </div>

        <button type='button' onClick={handleLeaveButton}>
          방 나가기
        </button>
        <button type='button' onClick={handleDisconnectButton}>
          소켓 끊기
        </button>
      </div>
      <div className='flex flex-1 border'>
        {screenSharingMediaStream && <VideoPlayer stream={screenSharingMediaStream} />}
        {Array.from(participantsMediaStream.entries()).map(([userId, stream]) => (
          <VideoPlayer key={`${userId}-${stream.id}`} stream={stream} />
        ))}
      </div>
    </div>
  );
}
