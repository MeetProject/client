'use client';

import { useCallback } from 'react';

import { APP_PATH } from '@/constant/signalPath';
import { getSdpPayload } from '@/lib/signalSocket';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { useWebRTCStore } from '@/store/WebRTCStore';
import {
	AnswerResponseType,
	CreateSignalClientType,
	DeviceResponseType,
	HandUpResponseType,
	IcePayloadType,
	IceResponseType,
	JoinResponseType,
	LeaveResponseType,
	OfferResponseType,
	ScreenResponseType,
	StreamType,
} from '@/type/signalType';
import { DeviceEnableType } from '@/type/streamType';

interface UseSignalEventHandlerProps {
	disconnectPeerConnection: (targetId: string, streamType: StreamType) => void;
	createPeerConnection: (
		targetId: string,
		onIceCandidate: (targetId: string, candidate: RTCIceCandidate, streamType: StreamType) => void,
		streamType: 'SCREEN' | 'USER',
		isScreenSender?: boolean,
	) => Promise<void>;
	createOfferSdp: (targetId: string, streamType: StreamType) => Promise<RTCSessionDescriptionInit>;
	createAnswerSdp: (targetId: string, streamType: StreamType) => Promise<RTCSessionDescriptionInit>;
	registerAnswerSdp: (
		targetId: string,
		targetSdp: RTCSessionDescriptionInit,
		streamType: StreamType,
		mediaOption?: DeviceEnableType,
	) => Promise<void>;
	registerOfferSdp: (targetId: string, sdp: RTCSessionDescriptionInit, streamType: StreamType) => Promise<void>;
	registerRemoteIce: (targetId: string, targetIce: RTCIceCandidateInit, streamType: StreamType) => Promise<void>;
}

const useSignalEventHandler = ({
	createAnswerSdp,
	createOfferSdp,
	createPeerConnection,
	disconnectPeerConnection,
	registerAnswerSdp,
	registerOfferSdp,
	registerRemoteIce,
}: UseSignalEventHandlerProps) => {
	const offerIceCandidate = useCallback(
		(targetId: string, candidate: RTCIceCandidate, streamType: StreamType, socket: CreateSignalClientType) => {
			if (!useUserInfoStore.getState().id) {
				return;
			}

			const payload: IcePayloadType = {
				fromCandidate: JSON.stringify(candidate),
				streamType,
				toUserId: targetId,
			};

			socket.publish(APP_PATH.ICE, payload);
		},
		[],
	);

	const handleLeaveResponse = useCallback(
		(response: LeaveResponseType) => {
			const { fromUserId, streamType } = response;
			const {
				deleteParticipantsMediaStream,
				deleteParticipantsUserData,
				setScreenOwnerId,
				setScreenSharingMediaStream,
			} = useWebRTCStore.getState();
			disconnectPeerConnection(fromUserId, streamType);

			if (streamType === 'USER') {
				deleteParticipantsUserData(fromUserId);
				deleteParticipantsMediaStream(fromUserId);
				return;
			}

			setScreenSharingMediaStream(null);
			setScreenOwnerId(null);
		},
		[disconnectPeerConnection],
	);

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
			const { participants, screenId } = response;
			participants.forEach(async (participant) => {
				const { isHandUp, ...userData } = participant;
				updateParticipantsUserData(participant.userId, userData);
				updateParticipantsHandUp(participant.userId, isHandUp);
				await createPeerConnection(
					participant.userId,
					(targetId, candidate, streamType) => offerIceCandidate(targetId, candidate, streamType, socket),
					'USER',
					false,
				);
				const sdp = await createOfferSdp(participant.userId, 'USER');
				await registerOfferSdp(participant.userId, sdp, 'USER');
				const payload = getSdpPayload(participant.userId, sdp, 'USER');
				socket.publish(APP_PATH.OFFER, payload);
			});

			if (screenId) {
				await createPeerConnection(
					screenId,
					(targetId, candidate, streamType) => offerIceCandidate(targetId, candidate, streamType, socket),
					'SCREEN',
					false,
				);
				const sdp = await createOfferSdp(screenId, 'SCREEN');
				await registerOfferSdp(screenId, sdp, 'SCREEN');
				const payload = getSdpPayload(screenId, sdp, 'SCREEN');
				socket.publish(APP_PATH.OFFER, payload);
			}
		},
		[createOfferSdp, createPeerConnection, offerIceCandidate, registerOfferSdp],
	);

	const handleOffer = useCallback(
		async (response: OfferResponseType, socket: CreateSignalClientType) => {
			const { updateParticipantsHandUp, updateParticipantsUserData } = useWebRTCStore.getState();
			const { fromUserId, fromUserSDP, isScreenSender, mediaOption, streamType, user } = response;
			const { isHandUp, ...userData } = user;
			const fromSDP = JSON.parse(fromUserSDP) as RTCSessionDescriptionInit;

			await createPeerConnection(
				fromUserId,
				(targetId, candidate, streamType) => offerIceCandidate(targetId, candidate, streamType, socket),
				streamType,
				isScreenSender,
			);

			updateParticipantsUserData(fromUserId, userData);
			updateParticipantsHandUp(fromUserId, isHandUp);

			await registerAnswerSdp(fromUserId, fromSDP, streamType, mediaOption);
			const sdp = await createAnswerSdp(fromUserId, streamType);
			await registerOfferSdp(fromUserId, sdp, streamType);
			const payload = getSdpPayload(fromUserId, sdp, streamType);
			socket.publish(APP_PATH.ANSWER, payload);
		},
		[createAnswerSdp, createPeerConnection, offerIceCandidate, registerAnswerSdp, registerOfferSdp],
	);

	const handleAnswer = useCallback(
		async (response: AnswerResponseType) => {
			const { fromUserId, fromUserSDP, streamType } = response;
			const sdp = JSON.parse(fromUserSDP) as RTCSessionDescriptionInit;
			await registerAnswerSdp(fromUserId, sdp, streamType);
		},
		[registerAnswerSdp],
	);

	const handleIce = useCallback(
		async (response: IceResponseType) => {
			const { fromUserIce, fromUserId, streamType } = response;
			const candidate = JSON.parse(fromUserIce) as RTCLocalIceCandidateInit;
			await registerRemoteIce(fromUserId, candidate, streamType);
		},
		[registerRemoteIce],
	);

	const handleScreen = useCallback(
		async (response: ScreenResponseType, socket: CreateSignalClientType) => {
			const { participants } = response;
			participants.forEach(async (participant) => {
				await createPeerConnection(
					participant,
					(targetId, candidate, streamType) => offerIceCandidate(targetId, candidate, streamType, socket),
					'SCREEN',
					true,
				);
				const sdp = await createOfferSdp(participant, 'SCREEN');
				await registerOfferSdp(participant, sdp, 'SCREEN');
				const payload = getSdpPayload(participant, sdp, 'SCREEN');
				socket.publish(APP_PATH.OFFER, payload);
			});
		},
		[createOfferSdp, createPeerConnection, offerIceCandidate, registerOfferSdp],
	);

	return {
		handleAnswer,
		handleDeviceResponse,
		handleHandUpResponse,
		handleIce,
		handleJoin,
		handleLeaveResponse,
		handleOffer,
		handleScreen,
	};
};

export default useSignalEventHandler;
