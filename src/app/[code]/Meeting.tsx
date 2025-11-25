'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useContext, useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Loading } from '@/component';
import { ToggleContext } from '@/context/ToggleContext';
import { useDevice2 } from '@/hook';
import useWebRTC from '@/hook/useWebRTC/useWebRTC';
import { timeDifferenceInMinutes } from '@/lib/getTimeDiff';
import { useClientStore } from '@/store/ClientStore';
import { useDeviceStore } from '@/store/DeviceStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { useWebRTCStore } from '@/store/WebRTCStore';
import { UserListType } from '@/type/participantType';
import { ChatResponseType, ChatType, EmojiResponseType } from '@/type/reactionType';
import { ErrorResponseType } from '@/type/signalType';

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
  const router = useRouter();
  const isRender = useRef<boolean>(false);
  const [isPending, setIsPending] = useState(true);
  const wrapperReference = useRef<HTMLDivElement>(null);
  const barReference = useRef<HTMLDivElement>(null);

  const [emojiList, setEmojiList] = useState<EmojiResponseType[]>([]);
  const [chatList, setChatList] = useState<ChatType[]>([]);

  const { color, id, name } = useUserInfoStore(
    useShallow((state) => ({
      color: state.color,
      id: state.id,
      name: state.name,
    })),
  );

  const { participantsMediaStream, participantsUserData, screenSharingMediaStream } = useWebRTCStore(
    useShallow((state) => ({
      participantsMediaStream: state.participantsMediaStream,
      participantsUserData: state.participantsUserData,
      screenSharingMediaStream: state.screenSharingMediaStream,
    })),
  );

  const { updateStream } = useDevice2();

  const handleChat = useCallback((data: ChatResponseType) => {
    const { participantsUserData: userData } = useWebRTCStore.getState();
    setChatList((previous) => {
      if (previous.length === 0) {
        return [{ ...data, header: true, userName: userData.get(data.userId)?.userName }];
      }
      const lastChat = previous[previous.length - 1];
      if (timeDifferenceInMinutes(lastChat.timestamp, data.timestamp) > 2 || data.userId !== lastChat.userId) {
        return [...previous, { ...data, header: true, userName: userData.get(data.userId)?.userName }];
      }
      return [...previous, { ...data, header: false, userName: userData.get(data.userId)?.userName }];
    });
  }, []);

  const handleEmoji = useCallback((data: EmojiResponseType) => {
    setEmojiList((previous) => [...previous, data]);
  }, []);

  const handleError = useCallback(
    (data: ErrorResponseType) => {
      const { message } = data;
      alert(message);
      router.push('/landing');
    },
    [router],
  );

  const {
    joinRoom,
    joinSession,
    leaveRoom,
    sendChat,
    sendDevice,
    sendEmoji,
    sendHandUp,
    shareScreen,
    stopShareScreen,
  } = useWebRTC({
    onChat: handleChat,
    onEmoji: handleEmoji,
    onError: handleError,
  });

  const { deviceEnable, screenStream, stream } = useDeviceStore(
    useShallow((state) => ({
      deviceEnable: state.deviceEnable,
      permission: state.permission,
      screenStream: state.screenStream,
      stream: state.stream,
    })),
  );

  const { handleToggleStatus } = useContext(ToggleContext);

  const deleteEmoji = useCallback((emojiId: string) => {
    setEmojiList((previous) => previous.filter((emoji) => emoji.id !== emojiId));
  }, []);

  const userList: UserListType[] = Array.from(participantsMediaStream).map(([index, s]) => ({
    color: participantsUserData.get(index)?.profileColor,
    id: index,
    isMicOn: true,
    isVideoOn: true,
    name: participantsUserData.get(index)?.userName,
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
    mediaElements.forEach((element) => {
      const mediaElement = element as HTMLMediaElement;
      if (mediaElement.setSinkId) {
        mediaElement.setSinkId(useDeviceStore.getState().audioOutput?.id);
      }
    });
  }, [isPending]);

  return (
    <div className='relative flex h-screen w-screen flex-col overflow-hidden bg-[#202124]'>
      {!isPending && (
        <>
          <div
            className='relative flex flex-1 p-4'
            style={{ height: `calc(100vh - ${barReference.current?.clientHeight}px)` }}
          >
            <div ref={wrapperReference} className='relative flex-1 overflow-hidden'>
              {screenSharingMediaStream || screenStream ? (
                <StreamScreenList emojiList={emojiList} />
              ) : (
                <StreamGridList emojiList={emojiList} />
              )}
              {emojiList.map((emoji) => (
                <EmojiAnimation
                  key={emoji.id}
                  emoji={emoji}
                  maxWidth={wrapperReference.current?.clientWidth ?? 0}
                  deleteEmoji={deleteEmoji}
                />
              ))}
            </div>
            <Panel
              userList={[
                {
                  color,
                  id,
                  isMicOn: deviceEnable.audio,
                  isVideoOn: deviceEnable.video,
                  name,
                  stream,
                },
                ...userList,
              ]}
              chatList={chatList}
              onSendMessage={sendChat}
            />
          </div>
          <div ref={barReference} className='relative w-full shrink-0 bg-[#202124] font-googleSans text-base text-white'>
            <Toggle onClickEmojiButton={sendEmoji} />
            <div className='relative flex shrink-0 justify-between bg-[#212121] p-4'>
              <MeetInfoBar />
              <ControlBar
                handleScreenShare={shareScreen}
                handleStopScreenShare={stopShareScreen}
                handleLeavSession={leaveRoom}
                handleHandUp={sendHandUp}
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
