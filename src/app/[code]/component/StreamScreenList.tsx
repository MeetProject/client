'use client';

import { useShallow } from 'zustand/react/shallow';
import { useDeviceStore } from '@/store/DeviceStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { EmojiResponseType } from '@/type/reactionType';
import { useWebRTCStore } from '@/store/WebRTCStore';
import { VideoStream, OtherAudioStream } from './part/Stream';

interface StreamScreenListProps {
  emojiList: EmojiResponseType[];
}

export default function StreamScreenList({ emojiList }: StreamScreenListProps) {
  const { id, name, color } = useUserInfoStore(
    useShallow((state) => ({
      id: state.id,
      name: state.name,
      color: state.color,
    })),
  );

  const { stream, screenStream, deviceEnable, audioInput, videoInput } = useDeviceStore(
    useShallow((state) => ({
      stream: state.stream,
      screenStream: state.screenStream,
      deviceEnable: state.deviceEnable,
      audioInput: state.audioInput,
      videoInput: state.videoInput,
    })),
  );

  const {
    screenSharingMediaStream,
    participantsMediaStream,
    participantsUserData,
    screenOwnerId,
    participantsMediaOptions,
  } = useWebRTCStore(
    useShallow((state) => ({
      screenSharingMediaStream: state.screenSharingMediaStream,
      participantsMediaStream: state.participantsMediaStream,
      participantsUserData: state.participantsUserData,
      screenOwnerId: state.screenOwnerId,
      participantsMediaOptions: state.participantsMediaOptions,
    })),
  );

  const isOverflow = participantsMediaStream.size > 4;
  const currentParticipants = isOverflow
    ? Array.from(participantsMediaStream).slice(0, 3)
    : Array.from(participantsMediaStream);

  const otherSubscriber = isOverflow ? Array.from(participantsMediaStream).slice(3) : [];

  const screenOwnerInfo = {
    id: screenOwnerId,
    name: participantsUserData.get(screenOwnerId)?.userName ?? name,
    color: participantsUserData.get(screenOwnerId)?.profileColor ?? color,
    audio: screenOwnerId ? true : Boolean(deviceEnable.audio && audioInput?.id),
    video: screenOwnerId ? true : Boolean(deviceEnable.video && videoInput?.id),
  };

  return (
    <div className='relative flex size-full gap-4'>
      <div className='h-full flex-1 pr-2'>
        <VideoStream user={screenOwnerInfo} emojiList={emojiList} stream={screenSharingMediaStream ?? screenStream} />
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
              name: participantsUserData.get(userId)?.userName,
              color: participantsUserData.get(userId)?.profileColor,
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
            name={participantsUserData.get(otherSubscriber[0][0])?.userName}
            color={participantsUserData.get(otherSubscriber[0][0])?.profileColor}
          />
        )}
      </div>
    </div>
  );
}
