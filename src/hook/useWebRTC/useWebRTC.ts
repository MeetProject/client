'use client';

import { useCallback } from 'react';

import { USER_PATH } from '@/constant/signalPath';
import { useClientStore } from '@/store/ClientStore';
import { useWebRTCStore } from '@/store/WebRTCStore';
import {
	AnswerResponseType,
	ChatResponseType,
	CreateSignalClientType,
	EmojiResponseType,
	IceResponseType,
	JoinResponseType,
	OfferResponseType,
	ScreenResponseType,
} from '@/type/signalType';
import { ErrorResponseType } from '@/type/signalType';

import { useDevice } from '..';
import usePeerConnection from './usePeerConnection';
import usePeerConnectionEventHandler from './usePeerConnectionEventHandler';
import useSignalEventHandler from './useSignalEventHandler';
import useSignalSocket from './useSignalSocket';

interface UseWebRTCProperties {
	onChat?: (data: ChatResponseType) => void;
	onEmoji?: (data: EmojiResponseType) => void;
	onError?: (data: ErrorResponseType) => void;
}

const useWebRTC = ({ onChat, onEmoji, onError }: UseWebRTCProperties) => {
	const { stopScreenStream, stopStream, updateScreenStream, updateStream } = useDevice();
	const { onDeviceEnableChange, onDisplayShareEnd, onTrack } = usePeerConnectionEventHandler();
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

	const {
		handleAnswer,
		handleDeviceResponse,
		handleHandUpResponse,
		handleIce,
		handleJoin,
		handleLeaveResponse,
		handleOffer,
		handleScreen,
	} = useSignalEventHandler({
		createAnswerSdp,
		createOfferSdp,
		createPeerConnection,
		disconnectPeerConnection,
		registerAnswerSdp,
		registerOfferSdp,
		registerRemoteIce,
	});

	const handleSocketConnect = useCallback(
		(socket: CreateSignalClientType) => {
			useClientStore.getState().setIsClientReady(true);

			socket.signalSub<JoinResponseType>(USER_PATH.JOIN, (response) => handleJoin(response, socket));
			socket.signalSub<OfferResponseType>(USER_PATH.OFFER, (response) => handleOffer(response, socket));
			socket.signalSub<AnswerResponseType>(USER_PATH.ANSWER, handleAnswer);
			socket.signalSub<IceResponseType>(USER_PATH.ICE, handleIce);
			socket.signalSub<ScreenResponseType>(USER_PATH.SCREEN, (response) => handleScreen(response, socket));
			socket.signalSub<ErrorResponseType>(USER_PATH.ERROR, onError);
		},
		[handleAnswer, handleIce, onError, handleJoin, handleOffer, handleScreen],
	);

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
