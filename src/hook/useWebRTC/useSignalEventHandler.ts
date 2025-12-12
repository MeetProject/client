'use client';

import { useCallback } from 'react';

import { APP_PATH } from '@/constant/signalPath';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { useWebRTCStore } from '@/store/WebRTCStore';
import {
	AnswerPayloadType,
	AnswerResponseType,
	CreateSignalClientType,
	DeviceResponseType,
	HandUpResponseType,
	IcePayloadType,
	IceResponseType,
	JoinResponseType,
	LeaveResponseType,
	OfferPayloadType,
	OfferResponseType,
} from '@/type/signalType';

interface UseSignalEventHandlerProps {
	disconnectPeerConnection: () => void;
	createPeerConnection: (onIceCandidate: (candidate: RTCIceCandidate) => void) => Promise<void>;
	createOfferSdp: () => Promise<RTCSessionDescriptionInit>;
	createAnswerSdp: () => Promise<RTCSessionDescriptionInit>;
	registerRemoteSdp: (sdp: RTCSessionDescriptionInit) => Promise<void>;
	registerLocalSdp: (sdp: RTCSessionDescriptionInit) => Promise<void>;
	registerRemoteIce: (targetIce: RTCIceCandidateInit) => Promise<void>;
}

const useSignalEventHandler = ({
	createAnswerSdp,
	createOfferSdp,
	createPeerConnection,
	registerLocalSdp,
	registerRemoteIce,
	registerRemoteSdp,
}: UseSignalEventHandlerProps) => {
	const offerIceCandidate = useCallback((candidate: RTCIceCandidate, socket: CreateSignalClientType) => {
		const { id } = useUserInfoStore.getState();
		if (!id) {
			return;
		}

		const payload: IcePayloadType = {
			ice: JSON.stringify(candidate),
			userId: id,
		};

		socket.publish(APP_PATH.ICE, payload);
	}, []);

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

	const handleJoin = useCallback(
		async (response: JoinResponseType, socket: CreateSignalClientType) => {
			const { updateParticipantsHandUp, updateParticipantsUserData } = useWebRTCStore.getState();
			const { participants, userId } = response;
			participants.forEach(async (participant) => {
				const { isHandUp, ...userData } = participant;
				updateParticipantsUserData(participant.userId, userData);
				updateParticipantsHandUp(participant.userId, isHandUp);
			});

			await createPeerConnection((candidate) => offerIceCandidate(candidate, socket));
			const sdp = await createOfferSdp();
			await registerLocalSdp(sdp);
			const payload: OfferPayloadType = {
				sdp: JSON.stringify(sdp),
				userId,
			};
			socket.publish(APP_PATH.OFFER, payload);
		},
		[createOfferSdp, createPeerConnection, offerIceCandidate, registerLocalSdp],
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
			socket.publish(APP_PATH.ANSWER, payload);
		},
		[registerRemoteSdp, registerLocalSdp, createAnswerSdp],
	);

	const handleAnswer = useCallback(
		async (response: AnswerResponseType) => {
			const { sdp } = response;
			const parsedSdp = JSON.parse(sdp) as RTCSessionDescriptionInit;
			await registerRemoteSdp(parsedSdp);
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

	return {
		handleAnswer,
		handleDeviceResponse,
		handleHandUpResponse,
		handleIce,
		handleJoin,
		handleLeaveResponse,
		handleOffer,
	};
};

export default useSignalEventHandler;
