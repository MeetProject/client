import * as image from '@/asset/image';
import { EmojiType } from '@/type/toggleType';
import { StaticImageData } from 'next/image';
import EmojiButton from './EmojiButton';

interface EmojiButtonType {
  name: EmojiType;
  src: StaticImageData;
}
const EMOJI_BUTTON: EmojiButtonType[] = [
  { name: 'HEART', src: image.heartEmoji },
  { name: 'THUMBUP', src: image.thumbUpEmoji },
  { name: 'PARTYPOPPER', src: image.partyPoperEmoji },
  { name: 'CLAP', src: image.clapEmoji },
  { name: 'LAUGHTER', src: image.laughterEmoji },
  { name: 'SURPRISE', src: image.surpriceEmoji },
  { name: 'SAD', src: image.sadEmoji },
  { name: 'CURIOUS', src: image.curiousEmoji },
  { name: 'THUMBDOWN', src: image.thumbDownEmoji },
];

interface EmojiProps {
  onClickEmojiButton: (value: EmojiType) => void;
}

export default function Emoji({ onClickEmojiButton }: EmojiProps) {
  return (
    <div className='flex h-[52px] w-full items-end justify-center'>
      <div className='flex h-10 w-[360px] rounded-full bg-[#2C2C2C]'>
        {EMOJI_BUTTON.map((button) => (
          <EmojiButton key={button.name} {...button} onClick={() => onClickEmojiButton(button.name)} />
        ))}
      </div>
    </div>
  );
}
