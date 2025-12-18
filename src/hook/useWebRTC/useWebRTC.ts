'use client';

import { useCallback } from 'react';

import { useDevice } from '..';

import usePeerConnection from './usePeerConnection';
import useSignalEventHandler from './useSignalEventHandler';
import useSignalSocket from './useSignalSocket';

import { SIGNAL_PATH } from '@/constant/signalPath';
import { useClientStore } from '@/store/ClientStore';
import { usePendingTrackStore } from '@/store/PendingTrackStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { useWebRTCStore } from '@/store/WebRTCStore';
import {
	ChatResponseType,
	CreateSignalClientType,
	EmojiResponseType,
	IceResponseType,
	JoinResponseType,
	OfferResponseType,
} from '@/type/signalType';
import { ErrorResponseType } from '@/type/signalType';
import { getTrackType } from '@/util/trackType';

interface UseWebRTCProperties {
	onChat?: (data: ChatResponseType) => void;
	onEmoji?: (data: EmojiResponseType) => void;
	onError?: (data: ErrorResponseType) => void;
}

const useWebRTC = ({ onChat, onEmoji, onError }: UseWebRTCProperties) => {
	const { stopScreenStream, stopStream, updateScreenStream, updateStream } = useDevice();
	const {
		createAnswerSdp,
		createPeerConnection,
		disconnectPeerConnection,
		getTrack,
		registerLocalSdp,
		registerRemoteIce,
		registerRemoteSdp,
		registerTrack,
	} = usePeerConnection();

	const {
		handleDeviceResponse,
		handleHandUpResponse,
		handleIce,
		handleJoin,
		handleLeaveResponse,
		handleOffer,
		handleParticipantResponse,
	} = useSignalEventHandler({
		createAnswerSdp,
		getTrack,
		registerLocalSdp,
		registerRemoteIce,
		registerRemoteSdp,
		registerTrack,
	});

	const handleSocketConnect = useCallback(
		(socket: CreateSignalClientType) => {
			useClientStore.getState().setIsClientReady(true);
			socket.signalSub<JoinResponseType>(SIGNAL_PATH.JOIN, handleJoin);
			socket.signalSub<OfferResponseType>(SIGNAL_PATH.OFFER, (response) => handleOffer(response, socket));
			socket.signalSub<IceResponseType>(SIGNAL_PATH.ICE, handleIce);
			socket.signalSub<ErrorResponseType>(SIGNAL_PATH.ERROR, onError);
		},
		[handleIce, onError, handleJoin, handleOffer],
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
		sendNegotiation,
	} = useSignalSocket({
		createPeerConnection,
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
		const { id } = useUserInfoStore.getState();
		const { client } = useClientStore.getState();
		const { isScreenShare, setIsScreenShare } = useWebRTCStore.getState();
		if (isScreenShare || !client) {
			return;
		}
		const screemStream = await updateScreenStream(true);
		setIsScreenShare(true);

		const { addSenderTrack } = usePendingTrackStore.getState();

		screemStream.getTracks().forEach((track) => {
			addSenderTrack(track.id, {
				trackType: getTrackType('SCREEN', track.kind),
				userId: id,
			});
		});

		sendNegotiation();
	}, [updateScreenStream, sendNegotiation]);

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
