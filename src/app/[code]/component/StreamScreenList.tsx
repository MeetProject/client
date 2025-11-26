'use client';

import { useShallow } from 'zustand/react/shallow';

import { useDeviceStore } from '@/store/DeviceStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { useWebRTCStore } from '@/store/WebRTCStore';
import { EmojiResponseType } from '@/type/reactionType';

import { VideoStream, OtherAudioStream } from './part/Stream';

interface StreamScreenListProperties {
	emojiList: EmojiResponseType[];
}

export default function StreamScreenList({ emojiList }: StreamScreenListProperties) {
	const { color, id, name } = useUserInfoStore(
		useShallow((state) => ({
			color: state.color,
			id: state.id,
			name: state.name,
		})),
	);

	const { audioInput, deviceEnable, screenStream, stream, videoInput } = useDeviceStore(
		useShallow((state) => ({
			audioInput: state.audioInput,
			deviceEnable: state.deviceEnable,
			screenStream: state.screenStream,
			stream: state.stream,
			videoInput: state.videoInput,
		})),
	);

	const {
		participantsMediaOptions,
		participantsMediaStream,
		participantsUserData,
		screenOwnerId,
		screenSharingMediaStream,
	} = useWebRTCStore(
		useShallow((state) => ({
			participantsMediaOptions: state.participantsMediaOptions,
			participantsMediaStream: state.participantsMediaStream,
			participantsUserData: state.participantsUserData,
			screenOwnerId: state.screenOwnerId,
			screenSharingMediaStream: state.screenSharingMediaStream,
		})),
	);

	const isOverflow = participantsMediaStream.size > 4;
	const currentParticipants = isOverflow
		? Array.from(participantsMediaStream).slice(0, 3)
		: Array.from(participantsMediaStream);

	const otherSubscriber = isOverflow ? Array.from(participantsMediaStream).slice(3) : [];

	const screenOwnerInfo = {
		audio: screenOwnerId ? true : Boolean(deviceEnable.audio && audioInput?.deviceId),
		color: participantsUserData.get(screenOwnerId)?.profileColor ?? color,
		id: screenOwnerId,
		name: participantsUserData.get(screenOwnerId)?.userName ?? name,
		video: screenOwnerId ? true : Boolean(deviceEnable.video && videoInput?.deviceId),
	};

	return (
		<div className='relative flex size-full gap-4'>
			<div className='h-full flex-1 pr-2'>
				<VideoStream user={screenOwnerInfo} emojiList={emojiList} stream={screenSharingMediaStream ?? screenStream} />
			</div>
			<div className='grid h-full grid-rows-4 gap-4' style={{ width: 'min(25%, 208px)' }}>
				<VideoStream
					user={{
						audio: Boolean(deviceEnable.audio && audioInput?.deviceId),
						color,
						id,
						name,
						video: Boolean(deviceEnable.video && videoInput?.deviceId),
					}}
					muted
					stream={stream}
				/>

				{currentParticipants.map(([userId, mediaStream]) => (
					<VideoStream
						key={userId}
						user={{
							audio: participantsMediaOptions.get(userId)?.audio ?? true,
							color: participantsUserData.get(userId)?.profileColor,
							id: userId,
							name: participantsUserData.get(userId)?.userName,
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
