'use client';

import { useCallback } from 'react';

import { useDevice } from '..';

import usePeerConnection from './usePeerConnection';
import useSignalEventHandler from './useSignalEventHandler';
import useSignalSocket from './useSignalSocket';

import { USER_PATH } from '@/constant/signalPath';
import { useClientStore } from '@/store/ClientStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
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
import { TrackInfoType } from '@/type/streamType';

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
		registerTrack,
	} = usePeerConnection();

	const {
		handleAnswer,
		handleDeviceResponse,
		handleHandUpResponse,
		handleIce,
		handleJoin,
		handleLeaveResponse,
		handleOffer,
		handleParticipantResponse,
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
			socket.signalSub<AnswerResponseType>(USER_PATH.ANSWER, (response) => handleAnswer(response, socket));
			socket.signalSub<IceResponseType>(USER_PATH.ICE, handleIce);
			socket.signalSub<TrackResponseType>(USER_PATH.TRACK, handleTrack);
			socket.signalSub<ErrorResponseType>(USER_PATH.ERROR, onError);
		},
		[handleAnswer, handleIce, onError, handleJoin, handleOffer, handleTrack],
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
		sendTrack,
	} = useSignalSocket({
		onChat,
		onConnect: handleSocketConnect,
		onDevice: handleDeviceResponse,
		onEmoji,
		onHandUp: handleHandUpResponse,
		onLeave: handleLeaveResponse,
		onParticipant: handleParticipantResponse,
	});

	const stopShareScreen = useCallback(() => {
		const { setScreenOwnerId } = useWebRTCStore.getState();

		stopScreenStream();
		setScreenOwnerId(null);
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
		const { setIsScreenShare } = useWebRTCStore.getState();
		const { id } = useUserInfoStore.getState();
		const screemStream = await updateScreenStream(true);
		setIsScreenShare(true);

		const trackInfo = new Map<string, TrackInfoType>();

		screemStream.getTracks().forEach((track) => {
			registerTrack(track);
			trackInfo.set(track.id, { streamType: 'SCREEN', userId: id });
		});

		sendTrack(Object.fromEntries(trackInfo));
	}, [updateScreenStream, sendTrack, registerTrack]);

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
