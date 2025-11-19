'use client';

import { useEffect, useRef, useContext, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';

import { useDeviceStore } from '@/store/DeviceStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { ToggleContext } from '@/context/ToggleContext';
import { Loading } from '@/component';
import useWebRTC from '@/hook/useWebRTC/useWebRTC';
import { useClientStore } from '@/store/ClientStore';
import { timeDifferenceInMinutes } from '@/lib/getTimeDiff';
import { ChatType, EmojiResponseType } from '@/type/reactionType';
import { UserListType } from '@/type/participantType';
import { useDevice2 } from '@/hook';
import {
  ControlBar,
  EmojiAnimation,
  InfoBar,
  Panel,
  Toggle,
  MeetInfoBar,
  StreamGridList,
  StreamScreenList,
} from './component';

export default function Meetting() {
  const pathname = usePathname();
  const isRender = useRef<boolean>(false);
  const [isPending, setIsPending] = useState(true);
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
    const init = async () => {
      if (isRender.current) {
        return;
      }
      isRender.current = true;
      const { client } = useClientStore.getState();
      if (!client) {
        await joinSession();
      }
      await joinRoom(pathname.slice(1));
      setIsPending(false);
    };
    init();
  }, [stream, pathname, joinSession, joinRoom, updateStream]);

  useEffect(() => {
    if (!screenStream && screenSharingMediaStream) {
      handleToggleStatus('screen', 'disable');
      return;
    }
    handleToggleStatus('screen', Boolean(screenSharingMediaStream || screenStream));
  }, [handleToggleStatus, screenSharingMediaStream, screenStream]);

  useEffect(() => {
    if (!isPending) {
      return;
    }
    const mediaElements = document.querySelectorAll('audio, video');
    mediaElements.forEach((el) => {
      const mediaEl = el as HTMLMediaElement;
      if (mediaEl.setSinkId) {
        mediaEl.setSinkId(useDeviceStore.getState().audioOutput?.id);
      }
    });
  }, [isPending]);

  return (
    <div className='relative flex h-screen w-screen flex-col overflow-hidden bg-[#202124]'>
      {!isPending && (
        <>
          <div
            className='relative flex flex-1 p-4'
            style={{ height: `calc(100vh - ${barRef.current?.clientHeight}px)` }}
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
        </>
      )}

      <Loading isPending={isPending} />
    </div>
  );
}
