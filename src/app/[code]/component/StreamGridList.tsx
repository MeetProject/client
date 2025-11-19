'use client';

import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useUserInfoStore } from '@/store/UserInfoStore';
import { useDeviceStore } from '@/store/DeviceStore';
import { EmojiResponseType } from '@/type/reactionType';
import { ParticipantDataType } from '@/type/signalType';
import { DeviceEnableType } from '@/type/streamType';
import { VideoStream, OtherAudioStream } from './part/Stream';

interface StreamGridListProps {
  participantsMediaStream: Map<string, MediaStream>;
  participantsUserData: Map<string, ParticipantDataType>;
  participantsMediaOptions: Map<string, DeviceEnableType>;
  emojiList: EmojiResponseType[];
}

export default function StreamGridList({
  participantsMediaStream,
  participantsUserData,
  emojiList,
  participantsMediaOptions,
}: StreamGridListProps) {
  const [maxRow, setMaxRow] = useState(Math.min(Math.floor((window.innerWidth - 400) / 166), 1));

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

  const maxNum = maxRow <= 1 ? 1 : maxRow === 2 ? 4 : maxRow * (maxRow - 1);
  const currentPageSubscribers = maxNum === 1 ? [] : Array.from(participantsMediaStream).slice(0, maxNum - 2);
  const otherSubscriber =
    maxNum === 1 ? Array.from(participantsMediaStream) : Array.from(participantsMediaStream).slice(maxNum - 2);

  const rowNum = currentPageSubscribers.length + 1 < maxRow ? currentPageSubscribers.length + 1 : maxRow;

  useEffect(() => {
    const handleMaxNumUpdate = () => {
      const row = Math.max(Math.floor((window.innerWidth - 400) / 166), 2);
      setMaxRow(row);
    };
    window.addEventListener('resize', handleMaxNumUpdate);

    return () => {
      window.removeEventListener('resize', handleMaxNumUpdate);
    };
  }, []);

  return (
    <div
      className='relative grid size-full gap-4 border border-solid border-black'
      style={{
        gridTemplateColumns: `repeat(${currentPageSubscribers.length === 0 ? '1' : Math.min(rowNum, Math.ceil(Math.sqrt(1 + 4 * currentPageSubscribers.length) / 2))}, 1fr)`,
      }}
    >
      <VideoStream
        user={{
          id,
          name,
          color,
          audio: Boolean(deviceEnable.audio && audioInput?.id),
          video: Boolean(deviceEnable.video && videoInput?.id),
        }}
        muted
        emojiList={emojiList}
        stream={stream}
      />

      {currentPageSubscribers.map(([userId, mediaStream]) => (
        <VideoStream
          key={userId}
          user={{
            id: userId,
            name: participantsUserData.get(userId)?.userName,
            color: participantsUserData.get(userId)?.profileColor,
            audio: participantsMediaOptions.get(userId)?.audio ?? true,
            video: participantsMediaOptions.get(userId)?.video ?? true,
          }}
          stream={mediaStream}
          emojiList={emojiList}
        />
      ))}
      {otherSubscriber.length >= 1 &&
        (otherSubscriber.length === 1 ? (
          <VideoStream
            user={{
              id: otherSubscriber[0][0],
              name: participantsUserData.get(otherSubscriber[0][0])?.userName,
              color: participantsUserData.get(otherSubscriber[0][0])?.profileColor,
              audio: participantsMediaOptions.get(otherSubscriber[0][0])?.audio ?? true,
              video: participantsMediaOptions.get(otherSubscriber[0][0])?.video ?? true,
            }}
            stream={otherSubscriber[0][1]}
            emojiList={emojiList}
          />
        ) : (
          <OtherAudioStream
            otherStreams={otherSubscriber}
            name={participantsUserData.get(otherSubscriber[0][0])?.userName}
            color={participantsUserData.get(otherSubscriber[0][0])?.profileColor}
          />
        ))}
    </div>
  );
}
