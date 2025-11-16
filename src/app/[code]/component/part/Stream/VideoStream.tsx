'use client';

import { useEffect, useRef, useState } from 'react';
import Image, { StaticImageData } from 'next/image';
import { Publisher, Subscriber } from 'openvidu-browser';
import { Visualizer } from '@/component';
import * as Icon from '@/asset/icon';
import * as ImageSrc from '@/asset/image';
import { useDeviceStore } from '@/store/DeviceStore';
import { EmojiInfo } from '@/type/sessionType';
import { EmojiType } from '@/type/toggleType';

interface UserInfo extends Record<'id' | 'name' | 'color', string> {
  audio: boolean;
  video: boolean;
}

interface VideoStreamProps {
  user: UserInfo;
  subscriber: Subscriber | Publisher | null;
  muted?: boolean;
  emojiList?: EmojiInfo[];
  handsUpList?: Record<string, boolean>;
  stream?: MediaStream | null | undefined;
}

const EMOJI_IMAGE: Record<EmojiType, StaticImageData> = {
  clap: ImageSrc.clapEmoji,
  curious: ImageSrc.curiousEmoji,
  heart: ImageSrc.heartEmoji,
  laughter: ImageSrc.laughterEmoji,
  partyPoper: ImageSrc.partyPoperEmoji,
  sad: ImageSrc.sadEmoji,
  surprice: ImageSrc.surpriceEmoji,
  thumbDown: ImageSrc.thumbDownEmoji,
  thumbUp: ImageSrc.thumbUpEmoji,
};

export default function VideoStream({
  user,
  subscriber,
  muted = false,
  emojiList,
  handsUpList,
  stream,
}: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [emojiIcon, setEmojiIcon] = useState<EmojiInfo | null>(null);
  const audioOutput = useDeviceStore((state) => state.audioOutput);
  const isScreen = subscriber?.stream.typeOfVideo === 'SCREEN';

  useEffect(() => {
    if (!subscriber || !videoRef.current) {
      return;
    }

    subscriber.addVideoElement(videoRef.current);
    if (videoRef.current.setSinkId) {
      videoRef.current.setSinkId(audioOutput?.id);
    }

    if (isScreen) {
      videoRef.current.style.setProperty('transform', 'rotateY(0deg)');
    }
  }, [subscriber, audioOutput, isScreen]);

  useEffect(() => {
    if (!emojiList) {
      return;
    }

    setEmojiIcon(emojiList.findLast((emoji) => emoji.userId === user.id) ?? null);
  }, [emojiList, user.id]);

  const mediaStream = stream ?? subscriber?.stream.getMediaStream();
  return (
    <div className='relative flex size-full items-center'>
      <div className=' relative flex size-full items-center justify-center overflow-hidden rounded-lg bg-[#3C4043]'>
        <video
          ref={videoRef}
          autoPlay
          muted={muted}
          className={`absolute left-0 top-0 size-full ${isScreen ? 'object-contain' : 'object-cover'}`}
        />
        {!user.video && (
          <div className='absolute left-0 top-0 z-20 size-full bg-[#3C4043]'>
            <div
              className='absolute left-1/2 top-1/2 flex aspect-square h-2/5 -translate-x-1/2 -translate-y-1/2 items-center justify-center truncate rounded-full font-bold text-white'
              style={{ backgroundColor: user.color, fontSize: '150%' }}
            >
              {user.name}
            </div>
          </div>
        )}
        <div className='absolute right-2 top-2 z-30'>
          {mediaStream && user.audio ? (
            <Visualizer stream={mediaStream} />
          ) : (
            <div className='flex size-[26px] items-center justify-center rounded-full bg-[#34373A]'>
              <Icon.MicOff width={18} height={18} fill='#ffffff' />
            </div>
          )}
        </div>

        {emojiIcon && (
          <div className='absolute left-2 top-2 z-30 flex size-[26px] items-center justify-center rounded-full bg-[#34373A]'>
            <Image alt={emojiIcon.emojiType} src={EMOJI_IMAGE[emojiIcon.emojiType]} width={16} height={16} />
          </div>
        )}

        {handsUpList && handsUpList[user.id] ? (
          <div className='absolute bottom-2 left-2 z-30 flex h-6 max-w-full items-center justify-center gap-2 rounded-full bg-white pl-2 pr-3 font-googleSans text-sm text-[#202124]'>
            <Icon.HandsUp width={14} height={14} fill='#202124' />
            <p className='truncate'>{user.name}</p>
          </div>
        ) : (
          <div className='absolute bottom-2 left-2 z-30 w-full truncate font-googleSans text-sm text-white'>
            {user.name}
          </div>
        )}
      </div>
    </div>
  );
}
