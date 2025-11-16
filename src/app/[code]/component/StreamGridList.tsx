'use client';

import { useState, useEffect } from 'react';
import { Publisher, Subscriber } from 'openvidu-browser';
import { useShallow } from 'zustand/react/shallow';

import { useUserInfoStore } from '@/store/UserInfoStore';
import { useDeviceStore } from '@/store/DeviceStore';
import { UserInfo, EmojiInfo } from '@/type/sessionType';
import { VideoStream, OtherAudioStream } from './part/Stream';

interface StreamGridListProps {
  subscribers: [string, Subscriber | null][];
  publisher: Publisher | null | undefined;
  participants: Record<string, UserInfo>;
  emojiList: EmojiInfo[];
  handsUpList: Record<string, boolean>;
  stream: MediaStream | null | undefined;
}

export default function StreamGridList({
  subscribers,
  publisher,
  participants,
  emojiList,
  handsUpList,
  stream,
}: StreamGridListProps) {
  const [maxRow, setMaxRow] = useState(Math.min(Math.floor((window.innerWidth - 400) / 166), 1));

  const { id, name, color } = useUserInfoStore(
    useShallow((state) => ({
      id: state.id,
      name: state.name,
      color: state.color,
    })),
  );

  const { deviceEnable, audioInput, videoInput } = useDeviceStore(
    useShallow((state) => ({
      deviceEnable: state.deviceEnable,
      audioInput: state.audioInput,
      videoInput: state.videoInput,
    })),
  );

  const maxNum = maxRow <= 1 ? 1 : maxRow === 2 ? 4 : maxRow * (maxRow - 1);
  const currentPageSubscribers = maxNum === 1 ? [] : subscribers.slice(0, maxNum - 2);
  const otherSubscriber = maxNum === 1 ? subscribers : subscribers.slice(maxNum - 2);

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
      {publisher !== undefined && (
        <VideoStream
          user={{
            id,
            name,
            color,
            audio: Boolean(deviceEnable.audio && audioInput?.id),
            video: Boolean(deviceEnable.video && videoInput?.id),
          }}
          subscriber={publisher}
          muted
          emojiList={emojiList}
          handsUpList={handsUpList}
          stream={stream}
        />
      )}
      {currentPageSubscribers.map((entity) => (
        <VideoStream
          key={entity[0]}
          user={{ id: entity[0], ...participants[entity[0]] }}
          subscriber={entity[1]}
          emojiList={emojiList}
          handsUpList={handsUpList}
        />
      ))}
      {otherSubscriber.length >= 1 &&
        (otherSubscriber.length === 1 ? (
          <VideoStream
            user={{ id: otherSubscriber[0][0], ...participants[otherSubscriber[0][0]] }}
            subscriber={otherSubscriber[0][1]}
          />
        ) : (
          <OtherAudioStream
            otherSubscriber={otherSubscriber}
            name={participants[otherSubscriber[0][0]].name}
            color={participants[otherSubscriber[0][0]].color}
          />
        ))}
    </div>
  );
}
