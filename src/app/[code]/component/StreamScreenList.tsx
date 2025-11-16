'use client';

import { Publisher, Subscriber } from 'openvidu-browser';
import { useShallow } from 'zustand/react/shallow';

import { useDeviceStore } from '@/store/DeviceStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { EmojiInfo, UserInfo } from '@/type/sessionType';
import { VideoStream, OtherAudioStream } from './part/Stream';

interface StreamScreenListProps {
  screenPublisher: [string, Publisher | Subscriber];
  participants: Record<string, UserInfo>;
  publisher: Publisher | null | undefined;
  subscribers: [string, Subscriber | null][];
  emojiList: EmojiInfo[];
  handsUpList: Record<string, boolean>;
  stream: MediaStream | null | undefined;
}

export default function StreamScreenList({
  screenPublisher,
  participants,
  publisher,
  subscribers,
  emojiList,
  handsUpList,
  stream,
}: StreamScreenListProps) {
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

  const isOverflow = publisher ? subscribers.length > 3 : subscribers.length > 4;
  const currentSubscribers = isOverflow ? subscribers.slice(0, publisher ? 2 : 3) : subscribers;
  const otherSubscriber = isOverflow ? subscribers.slice(publisher ? 2 : 3) : [];

  return (
    <div className='relative flex size-full gap-4'>
      <div className='h-full flex-1 pr-2'>
        <VideoStream
          user={{ id: screenPublisher[0], ...participants[screenPublisher[0]] }}
          subscriber={screenPublisher[1]}
          emojiList={emojiList}
          handsUpList={handsUpList}
        />
      </div>
      <div className='grid h-full grid-rows-4 gap-4' style={{ width: 'min(25%, 208px)' }}>
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
            stream={stream}
          />
        )}
        {currentSubscribers.map((entity) => (
          <VideoStream
            key={entity[0]}
            user={{ id: entity[0], ...participants[entity[0]] }}
            subscriber={entity[1]}
            emojiList={emojiList}
            handsUpList={handsUpList}
          />
        ))}
        {isOverflow && (
          <OtherAudioStream
            otherSubscriber={otherSubscriber}
            name={participants[otherSubscriber[0][0]].name}
            color={participants[otherSubscriber[0][0]].color}
          />
        )}
      </div>
    </div>
  );
}
