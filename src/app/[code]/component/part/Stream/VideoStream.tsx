'use client';

import Image, { StaticImageData } from 'next/image';
import { useEffect, useRef, useState } from 'react';

import * as Icon from '@/asset/icon';
import * as ImageSrc from '@/asset/image';
import { Visualizer } from '@/component';
import { useWebRTCStore } from '@/store/WebRTCStore';
import { EmojiResponseType } from '@/type/reactionType';
import { EmojiType } from '@/type/reactionType';

interface UserInfo extends Record<'id' | 'name' | 'color', string> {
	audio: boolean;
	video: boolean;
}

interface VideoStreamProperties {
	user: UserInfo;
	isScreen?: boolean;
	stream: MediaStream | null;
	muted?: boolean;
	emojiList?: EmojiResponseType[];
}

const EMOJI_IMAGE: Record<EmojiType, StaticImageData> = {
	CLAP: ImageSrc.clapEmoji,
	CURIOUS: ImageSrc.curiousEmoji,
	HEART: ImageSrc.heartEmoji,
	LAUGHTER: ImageSrc.laughterEmoji,
	PARTYPOPPER: ImageSrc.partyPoperEmoji,
	SAD: ImageSrc.sadEmoji,
	SURPRISE: ImageSrc.surpriceEmoji,
	THUMBDOWN: ImageSrc.thumbDownEmoji,
	THUMBUP: ImageSrc.thumbUpEmoji,
};

export default function VideoStream({
	emojiList,
	isScreen = false,
	muted = false,
	stream,
	user,
}: VideoStreamProperties) {
	const videoReference = useRef<HTMLVideoElement | null>(null);
	const [emojiIcon, setEmojiIcon] = useState<EmojiResponseType | null>(null);

	const { participantsHandUp } = useWebRTCStore();

	useEffect(() => {
		if (!videoReference.current || !stream) return;

		const liveTracks = stream.getTracks().filter((t): t is MediaStreamTrack => t.readyState === 'live');

		if (liveTracks.length === 0) {
			// live track이 없으면 빈 스트림 대신 null 설정
			videoReference.current.srcObject = null;
			return;
		}

		const safeStream = new MediaStream(liveTracks);
		videoReference.current.srcObject = safeStream;

		videoReference.current.play().catch(() => {});
	}, [stream, isScreen]);

	useEffect(() => {
		if (!emojiList) {
			return;
		}

		setEmojiIcon(emojiList.findLast((emoji) => emoji.userId === user.id) ?? null);
	}, [emojiList, user.id]);

	return (
		<div className='relative flex size-full items-center'>
			<div className=' relative flex size-full items-center justify-center overflow-hidden rounded-lg bg-[#3C4043]'>
				<video
					autoPlay={true}
					className={`absolute left-0 top-0 size-full ${isScreen ? 'object-contain' : 'object-cover'}`}
					muted={muted}
					ref={videoReference}
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
					{user.audio ? (
						<Visualizer stream={stream} />
					) : (
						<div className='flex size-[26px] items-center justify-center rounded-full bg-[#34373A]'>
							<Icon.MicOff fill='#ffffff' height={18} width={18} />
						</div>
					)}
				</div>

				{emojiIcon && (
					<div className='absolute left-2 top-2 z-30 flex size-[26px] items-center justify-center rounded-full bg-[#34373A]'>
						<Image alt={emojiIcon.emoji} height={16} src={EMOJI_IMAGE[emojiIcon.emoji]} width={16} />
					</div>
				)}

				{participantsHandUp && participantsHandUp.get(user.id) ? (
					<div className='absolute bottom-2 left-2 z-30 flex h-6 max-w-full items-center justify-center gap-2 rounded-full bg-white pl-2 pr-3 font-googleSans text-sm text-[#202124]'>
						<Icon.HandsUp fill='#202124' height={14} width={14} />
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
