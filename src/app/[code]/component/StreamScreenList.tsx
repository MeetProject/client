'use client';

import { useShallow } from 'zustand/react/shallow';
import { useDeviceStore } from '@/store/DeviceStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { EmojiResponseType } from '@/type/reactionType';
import { MutableRefObject } from 'react';
import { ParticipantDataType } from '@/type/signalType';
import { DeviceEnableType } from '@/type/streamType';
import { VideoStream, OtherAudioStream } from './part/Stream';

interface StreamScreenListProps {
  screenSharingMediaStream: MediaStream | null;
  participantsMediaStream: Map<string, MediaStream>;
  participantsUserData: MutableRefObject<Map<string, ParticipantDataType>>;
  participantsMediaOptions: Map<string, DeviceEnableType>;
  screenOwnerId: string;
  emojiList: EmojiResponseType[];
}

export default function StreamScreenList({
  screenSharingMediaStream,
  participantsMediaStream,
  screenOwnerId,
  emojiList,
  participantsUserData,
  participantsMediaOptions,
}: StreamScreenListProps) {
  const { id, name, color } = useUserInfoStore(
    useShallow((state) => ({
      id: state.id,
      name: state.name,
      color: state.color,
    })),
  );

  const { stream, deviceEnable, audioInput, videoInput } = useDeviceStore(
    useShallow((state) => ({
      stream: state.stream,
      deviceEnable: state.deviceEnable,
      audioInput: state.audioInput,
      videoInput: state.videoInput,
    })),
  );

  const isOverflow = participantsMediaStream.size > 4;
  const currentParticipants = isOverflow
    ? Array.from(participantsMediaStream).slice(0, 3)
    : Array.from(participantsMediaStream);

  const otherSubscriber = isOverflow ? Array.from(participantsMediaStream).slice(3) : [];

  const screenOwnerInfo = {
    id: screenOwnerId,
    name: participantsUserData.current.get(screenOwnerId)?.userName ?? name,
    color: participantsUserData.current.get(screenOwnerId)?.profileColor ?? color,
    audio: screenOwnerId ? true : Boolean(deviceEnable.audio && audioInput?.id),
    video: screenOwnerId ? true : Boolean(deviceEnable.video && videoInput?.id),
  };

  return (
    <div className='relative flex size-full gap-4'>
      <div className='h-full flex-1 pr-2'>
        <VideoStream user={screenOwnerInfo} emojiList={emojiList} stream={screenSharingMediaStream} />
      </div>
      <div className='grid h-full grid-rows-4 gap-4' style={{ width: 'min(25%, 208px)' }}>
        <VideoStream
          user={{
            id,
            name,
            color,
            audio: Boolean(deviceEnable.audio && audioInput?.id),
            video: Boolean(deviceEnable.video && videoInput?.id),
          }}
          muted
          stream={stream}
        />

        {currentParticipants.map(([userId, mediaStream]) => (
          <VideoStream
            key={userId}
            user={{
              id: userId,
              name: participantsUserData.current.get(userId)?.userName,
              color: participantsUserData.current.get(userId)?.profileColor,
              audio: participantsMediaOptions.get(userId)?.audio ?? true,
              video: participantsMediaOptions.get(userId)?.video ?? true,
            }}
            emojiList={emojiList}
            stream={mediaStream}
          />
        ))}
        {isOverflow && (
          <OtherAudioStream
            otherStreams={otherSubscriber}
            name={participantsUserData.current.get(otherSubscriber[0][0])?.userName}
            color={participantsUserData.current.get(otherSubscriber[0][0])?.profileColor}
          />
        )}
      </div>
    </div>
  );
}
