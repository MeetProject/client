'use client';

import { useCallback } from 'react';

import { SIGNAL_PATH } from '@/constant/signalPath';
import { setScreenStream, setUserStream } from '@/lib/mediaStream';
import { usePendingTrackStore } from '@/store/PendingTrackStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { useWebRTCStore } from '@/store/WebRTCStore';
import {
	AnswerPayloadType,
	AnswerResponseType,
	CreateSignalClientType,
	DeviceResponseType,
	HandUpResponseType,
	IceResponseType,
	JoinResponseType,
	LeaveResponseType,
	OfferResponseType,
	ParticipantResponseType,
	TrackPayloadType,
	TrackResponseType,
} from '@/type/signalType';
import { TrackInfoType } from '@/type/streamType';

interface UseSignalEventHandlerProps {
	disconnectPeerConnection: () => void;
	createPeerConnection: (socket: CreateSignalClientType, userId: string) => Promise<void>;
	createOfferSdp: () => Promise<RTCSessionDescriptionInit>;
	createAnswerSdp: () => Promise<RTCSessionDescriptionInit>;
	registerRemoteSdp: (sdp: RTCSessionDescriptionInit) => Promise<void>;
	registerLocalSdp: (sdp: RTCSessionDescriptionInit) => Promise<void>;
	registerRemoteIce: (targetIce: RTCIceCandidateInit) => Promise<void>;
}

const useSignalEventHandler = ({
	createAnswerSdp,
	createPeerConnection,
	registerLocalSdp,
	registerRemoteIce,
	registerRemoteSdp,
}: UseSignalEventHandlerProps) => {
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

	const handleJoin = useCallback(
		async (response: JoinResponseType, socket: CreateSignalClientType) => {
			const { updateParticipantsHandUp, updateParticipantsUserData } = useWebRTCStore.getState();
			const { participants, userId } = response;
			participants.forEach(async (participant) => {
				const { isHandUp, ...userData } = participant;
				updateParticipantsUserData(participant.userId, userData);
				updateParticipantsHandUp(participant.userId, isHandUp);
			});

			await createPeerConnection(socket, userId);
		},
		[createPeerConnection],
	);

	const handleOffer = useCallback(
		async (response: OfferResponseType, socket: CreateSignalClientType) => {
			const { sdp, userId } = response;
			const parsedSdp = JSON.parse(sdp) as RTCSessionDescriptionInit;
			await registerRemoteSdp(parsedSdp);

			const answerSdp = await createAnswerSdp();
			await registerLocalSdp(answerSdp);
			const payload: AnswerPayloadType = {
				sdp: JSON.stringify(answerSdp),
				userId,
			};
			socket.publish('signal', SIGNAL_PATH.ANSWER, payload);
		},
		[registerRemoteSdp, registerLocalSdp, createAnswerSdp],
	);

	const handleAnswer = useCallback(
		async (response: AnswerResponseType, client: CreateSignalClientType) => {
			const { sdp } = response;
			const parsedSdp = JSON.parse(sdp) as RTCSessionDescriptionInit;
			await registerRemoteSdp(parsedSdp);

			const { id } = useUserInfoStore.getState();
			const { clearTransceiver, transceiver } = usePendingTrackStore.getState();

			const track = new Map<string, TrackInfoType>();

			Object.entries(transceiver).forEach(([type, t]) => {
				if (t?.mid) {
					track.set(t.mid, {
						streamType: type === 'audio' || type === 'video' ? 'USER' : 'SCREEN',
						userId: id,
					});
				}
			});

			if (track.size === 0) {
				return;
			}

			clearTransceiver();
			const payload: TrackPayloadType = {
				transceiver: Object.fromEntries(track),
				userId: id,
			};
			client.publish('signal', SIGNAL_PATH.TRACK, payload);
		},
		[registerRemoteSdp],
	);

	const handleIce = useCallback(
		async (response: IceResponseType) => {
			const { ice } = response;
			const candidate = JSON.parse(ice) as RTCLocalIceCandidateInit;
			await registerRemoteIce(candidate);
		},
		[registerRemoteIce],
	);

	const handleTrack = useCallback(async (response: TrackResponseType) => {
		const { transceiver } = response;

		Object.entries(transceiver).forEach(([mid, { streamType, userId }]) => {
			const { deletePendingTrack, pendingTrack, setPendingTrack } = usePendingTrackStore.getState();
			if (pendingTrack.has(mid)) {
				const { track: mediaTrack } = pendingTrack.get(mid);
				deletePendingTrack(mid);
				if (streamType === 'USER') {
					setUserStream(userId, mediaTrack);
					return;
				}

				setScreenStream(userId, mediaTrack);
				return;
			}
			setPendingTrack(mid, { streamType, userId });
		});
	}, []);

	return {
		handleAnswer,
		handleDeviceResponse,
		handleHandUpResponse,
		handleIce,
		handleJoin,
		handleLeaveResponse,
		handleOffer,
		handleParticipantResponse,
		handleTrack,
	};
};

export default useSignalEventHandler;
