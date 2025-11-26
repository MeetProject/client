'use client';

import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useDeviceStore } from '@/store/DeviceStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { useWebRTCStore } from '@/store/WebRTCStore';
import { EmojiResponseType } from '@/type/reactionType';

import { VideoStream, OtherAudioStream } from './part/Stream';

interface StreamGridListProperties {
  emojiList: EmojiResponseType[];
}

export default function StreamGridList({ emojiList }: StreamGridListProperties) {
  const [maxRow, setMaxRow] = useState(Math.min(Math.floor((window.innerWidth - 400) / 166), 1));

  const { color, id, name } = useUserInfoStore(
    useShallow((state) => ({
      color: state.color,
      id: state.id,
      name: state.name,
    })),
  );

  const { audioInput, deviceEnable, stream, videoInput } = useDeviceStore(
    useShallow((state) => ({
      audioInput: state.audioInput,
      deviceEnable: state.deviceEnable,
      stream: state.stream,
      videoInput: state.videoInput,
    })),
  );

  const { participantsMediaOptions, participantsMediaStream, participantsUserData } = useWebRTCStore(
    useShallow((state) => ({
      participantsMediaOptions: state.participantsMediaOptions,
      participantsMediaStream: state.participantsMediaStream,
      participantsUserData: state.participantsUserData,
    })),
  );

  const calculateMaxNumber = (maxRow: number) => {
    if (maxRow <= 1) {
      return 1;
    }

    if (maxRow === 2) {
      return 4;
    }

    return maxRow * (maxRow - 1);
  }

  const maxNumber = calculateMaxNumber(maxRow);
  const currentPageSubscribers = maxNumber === 1 ? [] : Array.from(participantsMediaStream).slice(0, maxNumber - 2);
  const otherSubscriber =
    maxNumber === 1 ? Array.from(participantsMediaStream) : Array.from(participantsMediaStream).slice(maxNumber - 2);

  const rowNumber = currentPageSubscribers.length + 1 < maxRow ? currentPageSubscribers.length + 1 : maxRow;

  useEffect(() => {
    const handleMaxNumberUpdate = () => {
      const row = Math.max(Math.floor((window.innerWidth - 400) / 166), 2);
      setMaxRow(row);
    };
    window.addEventListener('resize', handleMaxNumberUpdate);

    return () => {
      window.removeEventListener('resize', handleMaxNumberUpdate);
    };
  }, []);

  return (
    <div
      className='relative grid size-full gap-4 border border-solid border-black'
      style={{
        gridTemplateColumns: `repeat(${currentPageSubscribers.length === 0 ? '1' : Math.min(rowNumber, Math.ceil(Math.sqrt(1 + 4 * currentPageSubscribers.length) / 2))}, 1fr)`,
      }}
    >
      <VideoStream
        user={{
          audio: Boolean(deviceEnable.audio && audioInput?.deviceId),
          color,
          id,
          name,
          video: Boolean(deviceEnable.video && videoInput?.deviceId),
        }}
        muted
        emojiList={emojiList}
        stream={stream}
      />

      {currentPageSubscribers.map(([userId, mediaStream]) => (
        <VideoStream
          user={{
            audio: participantsMediaOptions.get(userId)?.audio ?? true,
            color: participantsUserData.get(userId)?.profileColor,
            id: userId,
            name: participantsUserData.get(userId)?.userName,
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
              audio: participantsMediaOptions.get(otherSubscriber[0][0])?.audio ?? true,
              color: participantsUserData.get(otherSubscriber[0][0])?.profileColor,
              id: otherSubscriber[0][0],
              name: participantsUserData.get(otherSubscriber[0][0])?.userName,
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
