'use client';

import { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { useShallow } from 'zustand/react/shallow';
import useWebRTC from '@/hook/useWebRTC/useWebRTC';
import { UserListType } from '@/type/participantType';
import { ChatType, EmojiResponseType } from '@/type/reactionType';
import { useDeviceStore } from '@/store/DeviceStore';
import { timeDifferenceInMinutes } from '@/lib/getTimeDiff';
import { useDevice2 } from '@/hook';
import { ToggleContext } from '@/context/ToggleContext';
import {
  ControlBar,
  EmojiAnimation,
  InfoBar,
  Panel,
  Toggle,
  MeetInfoBar,
  StreamGridList,
  StreamScreenList,
} from '../[code]/component';

export default function TestPage() {
  const [value, setValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const [emojiList, setEmojiList] = useState<EmojiResponseType[]>([]);
  const [chatList, setChatList] = useState<ChatType[]>([]);

  const { id, name, color } = useUserInfoStore(
    useShallow((state) => ({
      id: state.id,
      name: state.name,
      color: state.color,
    })),
  );

  const { updateStream } = useDevice2();

  const {
    joinSession,
    joinRoom,
    leaveRoom,
    leaveSession,
    shareScreen,
    stopShareScreen,
    sendChat,
    sendEmoji,
    sendDevice,
    participantsMediaStream,
    screenSharingMediaStream,
    participantsUserData,
    participantsMediaOptions,
    screenOwnerId,
  } = useWebRTC({
    onChat: (data) =>
      setChatList((prev) => {
        if (prev.length === 0) {
          return [{ ...data, userName: participantsUserData.get(data.userId)?.userName, header: true }];
        }
        const lastChat = prev[prev.length - 1];
        if (timeDifferenceInMinutes(lastChat.timestamp, data.timestamp) > 2 || data.userId !== lastChat.userId) {
          return [...prev, { ...data, userName: participantsUserData.get(data.userId)?.userName, header: true }];
        }
        return [...prev, { ...data, userName: participantsUserData.get(data.userId)?.userName, header: false }];
      }),
    onEmoji: (data) => setEmojiList((prev) => [...prev, data]),
  });

  const { stream, deviceEnable, screenStream } = useDeviceStore(
    useShallow((state) => ({
      stream: state.stream,
      screenStream: state.screenStream,
      deviceEnable: state.deviceEnable,
      permission: state.permission,
    })),
  );

  const { handleToggleStatus } = useContext(ToggleContext);

  const handleConnectButton = async () => {
    const payload = {
      userName: 'name',
      userColor: '#000000',
    };

    const response = await fetch('http://localhost:8080/api/user/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('회원 등록 실패');
    }

    const { userId } = await response.json();
    useUserInfoStore.getState().setId(userId);

    await joinSession();
  };

  const handleCreateRoom = async () => {
    const response = await fetch('http://localhost:8080/api/room/create', { method: 'POST' });
    if (!response.ok) {
      throw new Error('api Error');
    }

    const { roomId } = (await response.json()) as { roomId: string };
    console.log(roomId);
    await joinRoom(roomId);
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

  const deleteEmoji = useCallback((emojiId: string) => {
    setEmojiList((prev) => prev.filter((emoji) => emoji.id !== emojiId));
  }, []);

  const userList: UserListType[] = Array.from(participantsMediaStream).map(([i, s]) => ({
    id: i,
    name: participantsUserData.get(i)?.userName,
    color: participantsUserData.get(i)?.profileColor,
    isMicOn: true,
    isVideoOn: true,
    stream: s,
  }));

  useEffect(() => {
    updateStream();
  }, [updateStream]);

  useEffect(() => {
    if (!screenStream && screenSharingMediaStream) {
      handleToggleStatus('screen', 'disable');
      return;
    }
    handleToggleStatus('screen', Boolean(screenSharingMediaStream || screenStream));
  }, [handleToggleStatus, screenSharingMediaStream, screenStream]);

  console.log(participantsMediaStream);

  return (
    <div className='flex h-screen w-screen flex-col'>
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
      </div>

      <div className='relative flex-1 flex-col overflow-hidden bg-[#202124]'>
        <div
          className='relative flex flex-1 p-4'
          style={{ height: `calc(100vh - ${barRef.current?.clientHeight ?? 0 + 188}px)` }}
        >
          <div ref={wrapperRef} className='relative flex-1 overflow-hidden'>
            {screenSharingMediaStream || screenStream ? (
              <StreamScreenList
                screenSharingMediaStream={screenSharingMediaStream ?? screenStream}
                participantsMediaStream={participantsMediaStream}
                participantsUserData={participantsUserData}
                participantsMediaOptions={participantsMediaOptions}
                screenOwnerId={screenOwnerId}
                emojiList={emojiList}
              />
            ) : (
              <StreamGridList
                participantsMediaStream={participantsMediaStream}
                participantsUserData={participantsUserData}
                participantsMediaOptions={participantsMediaOptions}
                emojiList={emojiList}
              />
            )}
            {emojiList.map((emoji) => (
              <EmojiAnimation
                key={emoji.id}
                emoji={emoji}
                maxWidth={wrapperRef.current?.clientWidth ?? 0}
                participantsUserData={participantsUserData}
                deleteEmoji={deleteEmoji}
              />
            ))}
          </div>
          <Panel
            userList={[
              {
                id,
                name,
                color,
                isMicOn: deviceEnable.audio,
                isVideoOn: deviceEnable.video,
                stream,
              },
              ...userList,
            ]}
            chatList={chatList}
            onSendMessage={sendChat}
          />
        </div>
        <div ref={barRef} className='relative w-full shrink-0 bg-[#202124] font-googleSans text-base text-white'>
          <Toggle onClickEmojiButton={sendEmoji} />
          <div className='relative flex shrink-0 justify-between bg-[#212121] p-4'>
            <MeetInfoBar />
            <ControlBar
              handleScreenShare={shareScreen}
              handleStopScreenShare={stopShareScreen}
              handleLeavSession={leaveRoom}
              /* handleHandsUp={sendHandsUp} */
              handleDeviceEnable={sendDevice}
            />
            <InfoBar />
          </div>
        </div>
      </div>
    </div>
  );
}
