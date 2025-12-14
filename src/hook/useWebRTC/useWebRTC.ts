'use client';

import { useCallback } from 'react';

import { useDevice } from '..';

import usePeerConnection from './usePeerConnection';
import useSignalEventHandler from './useSignalEventHandler';
import useSignalSocket from './useSignalSocket';

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
	TrackResponseType,
} from '@/type/signalType';
import { ErrorResponseType } from '@/type/signalType';

interface UseWebRTCProperties {
	onChat?: (data: ChatResponseType) => void;
	onEmoji?: (data: EmojiResponseType) => void;
	onError?: (data: ErrorResponseType) => void;
}

const useWebRTC = ({ onChat, onEmoji, onError }: UseWebRTCProperties) => {
	const { stopScreenStream, stopStream, updateScreenStream, updateStream } = useDevice();
	const {
		createAnswerSdp,
		createOfferSdp,
		createPeerConnection,
		disconnectPeerConnection,
		registerLocalSdp,
		registerRemoteIce,
		registerRemoteSdp,
	} = usePeerConnection();

	const {
		handleAnswer,
		handleDeviceResponse,
		handleHandUpResponse,
		handleIce,
		handleJoin,
		handleLeaveResponse,
		handleOffer,
		handleTrack,
	} = useSignalEventHandler({
		createAnswerSdp,
		createOfferSdp,
		createPeerConnection,
		disconnectPeerConnection,
		registerLocalSdp,
		registerRemoteIce,
		registerRemoteSdp,
	});

	const handleSocketConnect = useCallback(
		(socket: CreateSignalClientType) => {
			useClientStore.getState().setIsClientReady(true);
			socket.subscribe<JoinResponseType>(USER_PATH.JOIN, (response) => handleJoin(response, socket));
			socket.subscribe<OfferResponseType>(USER_PATH.OFFER, (response) => handleOffer(response, socket));
			socket.signalSub<AnswerResponseType>(USER_PATH.ANSWER, handleAnswer);
			socket.signalSub<IceResponseType>(USER_PATH.ICE, handleIce);
			socket.signalSub<TrackResponseType>(USER_PATH.TRACK, handleTrack);
			socket.signalSub<ErrorResponseType>(USER_PATH.ERROR, onError);
		},
		[handleAnswer, handleIce, onError, handleJoin, handleOffer, handleTrack],
	);

	const { connectSocket, disconnectSocket, sendChat, sendDevice, sendEmoji, sendHandUp, sendJoin, sendLeave } =
		useSignalSocket({
			onChat,
			onConnect: handleSocketConnect,
			onDevice: handleDeviceResponse,
			onEmoji,
			onHandUp: handleHandUpResponse,
			onLeave: handleLeaveResponse,
		});

	const stopShareScreen = useCallback(() => {
		const { setIsScreenShare, setScreenSharingMediaStream } = useWebRTCStore.getState();
		setScreenSharingMediaStream(null);
		stopScreenStream();
		setIsScreenShare(false);
	}, [stopScreenStream]);

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
		setIsScreenShare(true);
	}, [updateScreenStream]);

	const clearPeerConnection = useCallback(() => {
		disconnectPeerConnection();
		const { setParticipantsMediaStream, setParticipantsUserData, setScreenSharingMediaStream } =
			useWebRTCStore.getState();
		setParticipantsUserData(new Map());
		setParticipantsMediaStream(new Map());
		setScreenSharingMediaStream(null);
	}, [disconnectPeerConnection]);

	const leaveRoom = useCallback(() => {
		const { isScreenShare } = useWebRTCStore.getState();
		if (isScreenShare) {
			stopShareScreen();
		}
		sendLeave();
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
