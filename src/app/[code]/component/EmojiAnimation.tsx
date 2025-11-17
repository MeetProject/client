'use client';

import { useUserInfoStore } from '@/store/UserInfoStore';
import { memo, MutableRefObject, useEffect } from 'react';
import Image, { StaticImageData } from 'next/image';
import { useShallow } from 'zustand/react/shallow';

import * as webp from '@/asset/webp';
import { EmojiType } from '@/type/toggleType';
import { EmojiResponseType } from '@/type/reactionType';
import { ParticipantDataType } from '@/type/signalType';

interface EmojiAnimationProps {
  emoji: EmojiResponseType;
  maxWidth: number;
  participantsUserData: MutableRefObject<Map<string, ParticipantDataType>>;
  deleteEmoji: (emojiId: string) => void;
}

const EMOJI_IMAGE: Record<EmojiType, StaticImageData> = {
  CLAP: webp.clapEmoji,
  CURIOUS: webp.curiousEmoji,
  HEART: webp.heartEmoji,
  LAUGHTER: webp.laughterEmoji,
  PARTYPOPPER: webp.partyPoperEmoji,
  SAD: webp.sadEmoji,
  SURPRISE: webp.surpriceEmoji,
  THUMBDOWN: webp.thumbDownEmoji,
  THUMBUP: webp.thumbUpEmoji,
};

function EmojiIcon({ emoji, maxWidth, participantsUserData, deleteEmoji }: EmojiAnimationProps) {
  const { id } = useUserInfoStore(
    useShallow((state) => ({
      id: state.id,
    })),
  );
  useEffect(() => {
    setTimeout(() => {
      deleteEmoji(emoji.id);
    }, 3000);
  }, [emoji, deleteEmoji]);
  return (
    <div
      className='absolute bottom-0 flex animate-move-bottom-up flex-col items-center justify-center gap-2'
      style={{ left: `${Math.random() * Math.min(Math.max(maxWidth - 36, 0), 250)}px` }}
    >
      <Image src={EMOJI_IMAGE[emoji.emoji]} width={36} height={36} alt={emoji.emoji} />
      <div
        className={`max-w-28 truncate rounded-full px-2 text-sm ${emoji.userId === id ? 'bg-[#8AB4F8] text-[#48525F]' : 'bg-[#202124] text-white'} `}
      >
        {id === emoji.userId ? '나' : participantsUserData.current.get(emoji.userId)?.userName}
      </div>
    </div>
  );
}

const EmojiAnimation = memo(EmojiIcon);

export default EmojiAnimation;
