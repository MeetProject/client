'use client';

import { useCallback } from 'react';

import { APP_PATH, USER_PATH } from '@/constant/signalPath';
import { getSdpPayload } from '@/lib/signalSocket';
import { useClientStore } from '@/store/ClientStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { useWebRTCStore } from '@/store/WebRTCStore';
import { AnswerResponseType, ChatResponseType, CreateSignalClientType, DeviceResponseType, EmojiResponseType, handUpPayloadType, HandUpResponseType, IcePayloadType, IceResponseType, JoinResponseType, LeaveResponseType, OfferResponseType, ScreenResponseType } from '@/type/signalType';
import { ErrorResponseType, StreamType } from '@/type/signalType';
import { DeviceEnableType } from '@/type/streamType';

import { useDevice } from '..';
import usePeerConnection from './usePeerConnection';
import useSignalSocket from './useSignalSocket';

interface UseWebRTCProperties {
	onChat?: (data: ChatResponseType) => void;
	onEmoji?: (data: EmojiResponseType) => void;
	onError?: (data: ErrorResponseType) => void;
}

const useWebRTC = ({ onChat, onEmoji, onError }: UseWebRTCProperties) => {
	const onTrack = useCallback(
		(targetId: string, targetStream: MediaStream, streamType: StreamType, isScreenSender: boolean) => {
			const { setScreenOwnerId, setScreenSharingMediaStream, updateParticipantsMediaStream } =
				useWebRTCStore.getState();

			if (streamType === 'USER') {
				updateParticipantsMediaStream(targetId, targetStream);
			}

			if (streamType === 'SCREEN' && !isScreenSender) {
				setScreenSharingMediaStream(targetStream);
				setScreenOwnerId(targetId);
			}
		},
		[],
	);

	const onDeviceEnableChange = useCallback((id: string, value: DeviceEnableType) => {
		const { updateParticipantsMediaOptions } = useWebRTCStore.getState();
		updateParticipantsMediaOptions(id, value);
	}, []);

	const { stopScreenStream, stopStream, updateScreenStream, updateStream } = useDevice();

	const onDisplayShareEnd = useCallback(() => {
		const { setScreenOwnerId } = useWebRTCStore.getState();
		stopScreenStream();
		setScreenOwnerId(null);
	}, [stopScreenStream]);

	const {
		createAnswerSdp,
		createOfferSdp,
		createPeerConnection,
		disconnectAllPeerConnection,
		disconnectAllScreenPeerConnection,
		disconnectPeerConnection,
		registerAnswerSdp,
		registerOfferSdp,
		registerRemoteIce,
	} = usePeerConnection({
		onDeviceEnableChange,
		onDisplayShareEnd,
		onTrack,
	});

	const deleteParticipant = useCallback(
		(targetId: string, streamType: StreamType) => {
			const {
				deleteParticipantsMediaStream,
				deleteParticipantsUserData,
				setScreenOwnerId,
				setScreenSharingMediaStream,
			} = useWebRTCStore.getState();
			disconnectPeerConnection(targetId, streamType);

			if (streamType === 'USER') {
				deleteParticipantsUserData(targetId);
				deleteParticipantsMediaStream(targetId);
				return;
			}

			setScreenSharingMediaStream(null);
			setScreenOwnerId(null);
		},
		[disconnectPeerConnection],
	);

	const handleLeaveResponse = useCallback((response: LeaveResponseType) => {
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
	}, [disconnectPeerConnection])

	const handleHandUpResponse = useCallback((response: HandUpResponseType) => {
		const { userId, value } = response;
		const { updateParticipantsHandUp } = useWebRTCStore.getState();
		updateParticipantsHandUp(userId, value);
	}, []);

	const handleDeviceResponse = useCallback((response: DeviceResponseType) => {
		const { mediaOption, userId } = response;
		const { updateParticipantsMediaOptions } = useWebRTCStore.getState();
		updateParticipantsMediaOptions(userId, mediaOption);
	}, [])

	const offerIceCandidate = useCallback((targetId: string, candidate: RTCIceCandidate, streamType: StreamType, socket: CreateSignalClientType) => {
		if (!useUserInfoStore.getState().id) {
			return;
		}

		const payload: IcePayloadType = {
			fromCandidate: JSON.stringify(candidate),
			streamType,
			toUserId: targetId,
		};

		socket.publish(APP_PATH.ICE, payload);
	}, []);

	const handleSocketConnect = useCallback((socket: CreateSignalClientType) => {
		useClientStore.getState().setIsClientReady(true);
		socket.signalSub<JoinResponseType>(USER_PATH.JOIN, async (response) => {
			const { updateParticipantsHandUp, updateParticipantsUserData } = useWebRTCStore.getState();
			const { participants, screenId } = response;
			participants.forEach(async (participant) => {
				const { isHandUp, ...userData } = participant;
				updateParticipantsUserData(participant.userId, userData);
				updateParticipantsHandUp(participant.userId, isHandUp);
				await createPeerConnection(participant.userId, (targetId, candidate, streamType) => offerIceCandidate(targetId, candidate, streamType, socket), 'USER', false);
				const sdp = await createOfferSdp(participant.userId, 'USER');
				await registerOfferSdp(participant.userId, sdp, 'USER');
				const payload = getSdpPayload(participant.userId, sdp, 'USER');
				socket.publish(APP_PATH.OFFER, payload);
			});

			if (screenId) {
				await createPeerConnection(screenId, (targetId, candidate, streamType) => offerIceCandidate(targetId, candidate, streamType, socket), 'SCREEN', false);
				const sdp = await createOfferSdp(screenId, 'SCREEN');
				await registerOfferSdp(screenId, sdp, 'SCREEN');
				const payload = getSdpPayload(screenId, sdp, 'SCREEN');
				socket.publish(APP_PATH.OFFER, payload);
			}
		});

		socket.signalSub<OfferResponseType>(USER_PATH.OFFER, async (response) => {
			const { updateParticipantsHandUp, updateParticipantsUserData } = useWebRTCStore.getState();
			const { fromUserId, fromUserSDP, isScreenSender, mediaOption, streamType, user } = response;
			const { isHandUp, ...userData } = user;
			const fromSDP = JSON.parse(fromUserSDP) as RTCSessionDescriptionInit;

			await createPeerConnection(fromUserId, (targetId, candidate, streamType) => offerIceCandidate(targetId, candidate, streamType, socket), streamType, isScreenSender);

			updateParticipantsUserData(fromUserId, userData);
			updateParticipantsHandUp(fromUserId, isHandUp);

			await registerAnswerSdp(fromUserId, fromSDP, streamType, mediaOption);
			const sdp = await createAnswerSdp(fromUserId, streamType);
			await registerOfferSdp(fromUserId, sdp, streamType);
			const payload = getSdpPayload(fromUserId, sdp, streamType);
			socket.publish(APP_PATH.ANSWER, payload);
		});

		socket.signalSub<AnswerResponseType>(USER_PATH.ANSWER, async (response) => {
			const { fromUserId, fromUserSDP, streamType } = response;
			const sdp = JSON.parse(fromUserSDP) as RTCSessionDescriptionInit;
			await registerAnswerSdp(fromUserId, sdp, streamType);
		});

		socket.signalSub<IceResponseType>(USER_PATH.ICE, async (response) => {
			const { fromUserIce, fromUserId, streamType } = response;
			const candidate = JSON.parse(fromUserIce) as RTCLocalIceCandidateInit;
			await registerRemoteIce(fromUserId, candidate, streamType);
		});

		socket.signalSub<ScreenResponseType>(USER_PATH.SCREEN, async (response) => {
			const { participants } = response;
			participants.forEach(async (participant) => {
				await createPeerConnection(participant, (targetId, candidate, streamType) => offerIceCandidate(targetId, candidate, streamType, socket), 'SCREEN', true);
				const sdp = await createOfferSdp(participant, 'SCREEN');
				await registerOfferSdp(participant, sdp, 'SCREEN');
				const payload = getSdpPayload(participant, sdp, 'SCREEN');
				socket.publish(APP_PATH.OFFER, payload);
			});
		});

		socket.signalSub<ErrorResponseType>(USER_PATH.ERROR, async (response) => {
			onError(response);
		});

	}, [offerIceCandidate, createAnswerSdp, createOfferSdp, createPeerConnection, registerAnswerSdp, registerOfferSdp, registerRemoteIce, onError])

	const {
		connectSocket,
		disconnectSocket,
		sendChat,
		sendDevice,
		sendEmoji,
		sendHandUp,
		sendJoin,
		sendLeave,
		shareScreen: sharingScreen,
	} = useSignalSocket({
		onChat,
		onConnect: handleSocketConnect,
		onDevice: handleDeviceResponse,
		onEmoji,
		onHandUp: handleHandUpResponse,
		onLeave: handleLeaveResponse,
	});

	const stopShareScreen = useCallback(() => {
		const { setIsScreenShare, setScreenSharingMediaStream } = useWebRTCStore.getState();
		sendLeave('SCREEN');
		disconnectAllScreenPeerConnection();
		setScreenSharingMediaStream(null);
		stopScreenStream();
		setIsScreenShare(false);
	}, [sendLeave, disconnectAllScreenPeerConnection, stopScreenStream]);

	const joinSession = useCallback(async () => {
		useClientStore.getState().setIsClientReady(false);
		connectSocket();
	}, [connectSocket]);

	const joinRoom = useCallback(
		async (targetRoomId: string) => {
			await updateStream();

			if (useClientStore.getState().isClientReady === null) {
				await joinSession();
			}

			await new Promise<void>((resolve) => {
				const interval = setInterval(() => {
					if (useClientStore.getState().isClientReady) {
						clearInterval(interval);
						resolve();
					}
				}, 100);
			});
			sendJoin(targetRoomId);
		},
		[sendJoin, updateStream, joinSession],
	);

	const shareScreen = useCallback(async () => {
		const { screenSharingMediaStream, setIsScreenShare } = useWebRTCStore.getState();
		if (screenSharingMediaStream) return;
		await updateScreenStream(true);
		sharingScreen();
		setIsScreenShare(true);
	}, [sharingScreen, updateScreenStream]);

	const clearPeerConnection = useCallback(() => {
		const { setParticipantsMediaStream, setParticipantsUserData, setScreenSharingMediaStream } =
			useWebRTCStore.getState();
		disconnectAllPeerConnection();
		disconnectAllScreenPeerConnection();
		setParticipantsUserData(new Map());
		setParticipantsMediaStream(new Map());
		setScreenSharingMediaStream(null);
	}, [disconnectAllPeerConnection, disconnectAllScreenPeerConnection]);

	const leaveRoom = useCallback(() => {
		const { isScreenShare } = useWebRTCStore.getState();
		if (isScreenShare) {
			stopShareScreen();
		}
		sendLeave('USER');
		clearPeerConnection();
		stopStream();
	}, [sendLeave, clearPeerConnection, stopStream, stopShareScreen]);

	const leaveSession = useCallback(() => {
		leaveRoom();
		disconnectSocket();
	}, [leaveRoom, disconnectSocket]);

	return {
		joinRoom,
		joinSession,
		leaveRoom,
		leaveSession,
		sendChat,
		sendDevice,
		sendEmoji,
		sendHandUp,
		shareScreen,
		stopShareScreen,
	};
};

export default useWebRTC;
