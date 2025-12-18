'use client';

import { useCallback } from 'react';

import { SIGNAL_PATH } from '@/constant/signalPath';
import { setScreenStream, setUserStream } from '@/lib/mediaStream';
import { useDeviceStore } from '@/store/DeviceStore';
import { usePendingTrackStore } from '@/store/PendingTrackStore';
import { useWebRTCStore } from '@/store/WebRTCStore';
import {
	AnswerPayloadType,
	CreateSignalClientType,
	DeviceResponseType,
	HandUpResponseType,
	IceResponseType,
	JoinResponseType,
	LeaveResponseType,
	OfferResponseType,
	ParticipantResponseType,
} from '@/type/signalType';
import { TrackInfoType } from '@/type/streamType';

interface UseSignalEventHandlerProps {
	createAnswerSdp: () => Promise<RTCSessionDescriptionInit>;
	registerRemoteSdp: (sdp: RTCSessionDescriptionInit) => Promise<void>;
	registerLocalSdp: (sdp: RTCSessionDescriptionInit) => Promise<void>;
	registerRemoteIce: (targetIce: RTCIceCandidateInit) => Promise<void>;
	registerTrack: (track: MediaStreamTrack) => Promise<string>;
	getTrack: (mid: string) => MediaStreamTrack;
}

const useSignalEventHandler = ({
	createAnswerSdp,
	getTrack,
	registerLocalSdp,
	registerRemoteIce,
	registerRemoteSdp,
	registerTrack,
}: UseSignalEventHandlerProps) => {
	const registerPendingTrack = useCallback(
		(trackInfo: Record<string, TrackInfoType>) => {
			const { setPendingTrack } = usePendingTrackStore.getState();

			Object.entries(trackInfo).forEach(([mid, { trackType, userId }]) => {
				const track = getTrack(mid);

				if (track) {
					if (trackType === 'audio' || trackType === 'video') {
						setUserStream(userId, track);
						return;
					}
					setScreenStream(userId, track);
					return;
				}
				setPendingTrack(mid, { trackType, userId });
			});
		},
		[getTrack],
	);

	const handleLeaveResponse = useCallback((response: LeaveResponseType) => {
		const { userId } = response;
		const { deleteParticipantsMediaStream, deleteParticipantsUserData } = useWebRTCStore.getState();

		deleteParticipantsUserData(userId);
		deleteParticipantsMediaStream(userId);
	}, []);

	const handleHandUpResponse = useCallback((response: HandUpResponseType) => {
		const { userId, value } = response;
		const { updateParticipantsHandUp } = useWebRTCStore.getState();
		updateParticipantsHandUp(userId, value);
	}, []);

	const handleDeviceResponse = useCallback((response: DeviceResponseType) => {
		const { mediaOption, userId } = response;
		const { updateParticipantsMediaOptions } = useWebRTCStore.getState();
		updateParticipantsMediaOptions(userId, mediaOption);
	}, []);

	const handleParticipantResponse = useCallback((response: ParticipantResponseType) => {
		const { mediaOption, user, userId } = response;
		const { updateParticipantsMediaOptions, updateParticipantsUserData } = useWebRTCStore.getState();
		updateParticipantsUserData(userId, user);
		updateParticipantsMediaOptions(userId, mediaOption);
	}, []);

	const handleJoin = useCallback(async (response: JoinResponseType) => {
		const { updateParticipantsHandUp, updateParticipantsUserData } = useWebRTCStore.getState();
		const { participants } = response;
		participants.forEach(async (participant) => {
			const { isHandUp, ...userData } = participant;
			updateParticipantsUserData(participant.userId, userData);
			updateParticipantsHandUp(participant.userId, isHandUp);
		});
	}, []);

	const handleOffer = useCallback(
		async (response: OfferResponseType, socket: CreateSignalClientType) => {
			const { sdp, trackInfo, userId: user } = response;
			registerPendingTrack(trackInfo);
			console.log('getOffer');
			const parsedSdp = JSON.parse(sdp) as RTCSessionDescriptionInit;
			await registerRemoteSdp(parsedSdp);

			const { clearSenderTrack, senderTrack } = usePendingTrackStore.getState();

			const tracks = new Map<string, TrackInfoType>();

			await Promise.all(
				Array.from(senderTrack.entries()).map(async ([trackId, senderTrackInfo]) => {
					const { screenStream, stream } = useDeviceStore.getState();
					if (senderTrackInfo.trackType === 'audio' || senderTrackInfo.trackType === 'video') {
						const track = stream.getTrackById(trackId);
						if (!track) {
							return;
						}
						const mid = await registerTrack(track);
						tracks.set(mid, senderTrackInfo);
						return;
					}
					const track = screenStream.getTrackById(trackId);
					const mid = await registerTrack(track);
					tracks.set(mid, senderTrackInfo);
				}),
			);
			clearSenderTrack();

			const answerSdp = await createAnswerSdp();
			await registerLocalSdp(answerSdp);

			const payload: AnswerPayloadType = {
				sdp: JSON.stringify(answerSdp),
				trackInfo: Object.fromEntries(tracks),
				userId: user,
			};
			socket.publish('signal', SIGNAL_PATH.ANSWER, payload);
		},
		[registerRemoteSdp, registerLocalSdp, createAnswerSdp, registerTrack, registerPendingTrack],
	);

	const handleIce = useCallback(
		async (response: IceResponseType) => {
			const { ice } = response;
			const candidate = JSON.parse(ice) as RTCLocalIceCandidateInit;
			await registerRemoteIce(candidate);
		},
		[registerRemoteIce],
	);

	return {
		handleDeviceResponse,
		handleHandUpResponse,
		handleIce,
		handleJoin,
		handleLeaveResponse,
		handleOffer,
		handleParticipantResponse,
	};
};

export default useSignalEventHandler;
