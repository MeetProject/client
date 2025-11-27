'use client';

import { Client, IMessage } from '@stomp/stompjs';
import { useCallback, useRef } from 'react';
import SockJS from 'sockjs-client';
import { useShallow } from 'zustand/react/shallow';

import { useClientStore } from '@/store/ClientStore';
import { useDeviceStore } from '@/store/DeviceStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { useWebRTCStore } from '@/store/WebRTCStore';
import { ChatResponseType, DeviceResponseType, EmojiResponseType, HandUpResponseType } from '@/type/reactionType';
import { EmojiType } from '@/type/reactionType';
import {
	IcePayloadType,
	JoinResponseType,
	SdpPayloadType,
	LeaveResponseType,
	JoinPayloadType,
	LeavePayloadType,
	IceResponseType,
	StreamType,
	ScreenPayloadType,
	ScreenResponseType,
	ErrorResponseType,
	OfferResponseType,
	AnswerResponseType,
} from '@/type/signalType';
import { DeviceEnableType } from '@/type/streamType';

interface UseSignalSocketProperties {
	onDeleteParticipant: (targetId: string, streamType: StreamType) => void;
	onChat: (data: ChatResponseType) => void;
	onEmoji: (data: EmojiResponseType) => void;
	onError: (data: ErrorResponseType) => void;
}

const useSignalSocket = ({ onChat, onDeleteParticipant, onEmoji, onError }: UseSignalSocketProperties) => {
	const { addRoomSubscriptions, addSubscriptions } = useClientStore(
		useShallow((state) => ({
			addRoomSubscriptions: state.addRoomSubscriptions,
			addSubscriptions: state.addSubscriptions,
			roomSubscriptions: state.roomSubscriptions,
			setClient: state.setClient,
			subscriptions: state.subscriptions,
		})),
	);

	const parseMessage = <T>(message: IMessage) => {
		const data = JSON.parse(message.body) as T;
		console.log(data);
		return data;
	};

	const sendJoin = useCallback(
		(roomId: string) => {
			const { client, setRoomId } = useClientStore.getState();
			if (!useClientStore.getState().client || !useUserInfoStore.getState().id) {
				return;
			}

			const payload: JoinPayloadType = {
				roomId,
			};

			client.publish({
				body: JSON.stringify(payload),
				destination: '/app/signal/join',
				headers: { 'content-type': 'application/json' },
			});

			const leaveSub = client.subscribe(`/topic/room/${roomId}/leave`, (message: IMessage) => {
				const { fromUserId, streamType } = parseMessage<LeaveResponseType>(message);
				onDeleteParticipant(fromUserId, streamType);
			});
			addRoomSubscriptions('leave', leaveSub);

			const chatSub = client.subscribe(`/topic/room/${roomId}/chat`, (message: IMessage) => {
				const response = parseMessage<ChatResponseType>(message);
				onChat(response);
			});
			addRoomSubscriptions('chat', chatSub);

			const emojuSub = client.subscribe(`/topic/room/${roomId}/emoji`, (message: IMessage) => {
				const response = parseMessage<EmojiResponseType>(message);
				onEmoji(response);
			});
			addRoomSubscriptions('emoji', emojuSub);

			const handUpSub = client.subscribe(`/topic/room/${roomId}/handup`, (message: IMessage) => {
				const { userId, value } = parseMessage<HandUpResponseType>(message);
				const { updateParticipantsHandUp } = useWebRTCStore.getState();
				updateParticipantsHandUp(userId, value);
			});
			addRoomSubscriptions('handUp', handUpSub);

			const deviceSub = client.subscribe(`/topic/room/${roomId}/device`, (message: IMessage) => {
				const { mediaOption, userId } = parseMessage<DeviceResponseType>(message);
				const { updateParticipantsMediaOptions } = useWebRTCStore.getState();
				updateParticipantsMediaOptions(userId, mediaOption);
			});
			addRoomSubscriptions('device', deviceSub);

			setRoomId(roomId);
		},
		[addRoomSubscriptions, onChat, onDeleteParticipant, onEmoji],
	);

	const sendSdp = useCallback(
		(destination: string, targetId: string, sdp: RTCSessionDescriptionInit, streamType: 'SCREEN' | 'USER') => {
			const { client } = useClientStore.getState();
			if (!client) {
				return;
			}

			const payload: SdpPayloadType = {
				fromUserSDP: JSON.stringify(sdp),
				mediaOption: streamType === 'USER' ? useDeviceStore.getState().deviceEnable : null,
				streamType,
				toUserId: targetId,
			};

			client.publish({
				body: JSON.stringify(payload),
				destination,
				headers: { 'content-type': 'application/json' },
			});
		},
		[],
	);

	const offerIceCandidate = useCallback((targetId: string, candidate: RTCIceCandidate, streamType: StreamType) => {
		const { client } = useClientStore.getState();
		if (!client || !useUserInfoStore.getState().id) {
			return;
		}

		const payload: IcePayloadType = {
			fromCandidate: JSON.stringify(candidate),
			streamType,
			toUserId: targetId,
		};

		client.publish({
			body: JSON.stringify(payload),
			destination: '/app/signal/ice',
			headers: { 'content-type': 'application/json' },
		});
	}, []);

	const connectSocket = useCallback(
		(
			createPeerConnection: (
				targetId: string,
				onIceCandidate: (targetId: string, candidate: RTCIceCandidate, streamType: 'SCREEN' | 'USER') => void,
				streamType: 'SCREEN' | 'USER',
				isScreenSender?: boolean,
			) => Promise<void>,
			createOfferSdp: (targetId: string, streamType: 'SCREEN' | 'USER') => Promise<RTCSessionDescriptionInit>,
			createAnswerSdp: (targetId: string, streamType: 'SCREEN' | 'USER') => Promise<RTCSessionDescriptionInit>,
			registerAnswerSdp: (
				targetId: string,
				targetSdp: RTCSessionDescriptionInit,
				streamType: 'SCREEN' | 'USER',
				mediaOption?: Record<'audio' | 'video', boolean>,
			) => Promise<void>,
			registerOfferSdp: (
				targetId: string,
				targetSdp: RTCSessionDescriptionInit,
				streamType: 'SCREEN' | 'USER',
			) => Promise<void>,
			registerRemoteIce: (
				targetId: string,
				targetIce: RTCLocalIceCandidateInit,
				streamType: 'SCREEN' | 'USER',
			) => Promise<void>,
		) => {
			const connectedClient = new Client({
				brokerURL: undefined,
				debug: (message) => console.log(message),
				onConnect: async () => {
					useClientStore.getState().setIsClientReady(true);
					const joinSub = connectedClient.subscribe('/user/queue/signal/join', async (message: IMessage) => {
						const { updateParticipantsHandUp, updateParticipantsUserData } = useWebRTCStore.getState();
						const { participants, screenId } = parseMessage<JoinResponseType>(message);
						participants.forEach(async (participant) => {
							const { isHandUp, ...userData } = participant;
							updateParticipantsUserData(participant.userId, userData);
							updateParticipantsHandUp(participant.userId, isHandUp);
							await createPeerConnection(participant.userId, offerIceCandidate, 'USER', false);
							const sdp = await createOfferSdp(participant.userId, 'USER');
							await registerOfferSdp(participant.userId, sdp, 'USER');
							sendSdp('/app/signal/offer', participant.userId, sdp, 'USER');
						});

						if (screenId) {
							await createPeerConnection(screenId, offerIceCandidate, 'SCREEN', false);
							const sdp = await createOfferSdp(screenId, 'SCREEN');
							await registerOfferSdp(screenId, sdp, 'SCREEN');
							sendSdp('/app/signal/offer', screenId, sdp, 'SCREEN');
						}
					});
					addSubscriptions('join', joinSub);

					const offerSub = connectedClient.subscribe('/user/queue/signal/offer', async (message: IMessage) => {
						const { updateParticipantsHandUp, updateParticipantsUserData } = useWebRTCStore.getState();
						const { fromUserId, fromUserSDP, isScreenSender, mediaOption, streamType, user } =
							parseMessage<OfferResponseType>(message);
						const { isHandUp, ...userData } = user;
						const fromSDP = JSON.parse(fromUserSDP) as RTCSessionDescriptionInit;

						await createPeerConnection(fromUserId, offerIceCandidate, streamType, isScreenSender);

						updateParticipantsUserData(fromUserId, userData);
						updateParticipantsHandUp(fromUserId, isHandUp);

						await registerAnswerSdp(fromUserId, fromSDP, streamType, mediaOption);
						const sdp = await createAnswerSdp(fromUserId, streamType);
						await registerOfferSdp(fromUserId, sdp, streamType);
						sendSdp('/app/signal/answer', fromUserId, sdp, streamType);
					});
					addSubscriptions('offer', offerSub);

					const answerSub = connectedClient.subscribe('/user/queue/signal/answer', async (message: IMessage) => {
						const { fromUserId, fromUserSDP, streamType } = parseMessage<AnswerResponseType>(message);
						const sdp = JSON.parse(fromUserSDP) as RTCSessionDescriptionInit;
						await registerAnswerSdp(fromUserId, sdp, streamType);
					});
					addSubscriptions('answer', answerSub);

					const iceSub = connectedClient.subscribe('/user/queue/signal/ice', async (message: IMessage) => {
						const { fromUserIce, fromUserId, streamType } = parseMessage<IceResponseType>(message);
						const candidate = JSON.parse(fromUserIce) as RTCLocalIceCandidateInit;
						await registerRemoteIce(fromUserId, candidate, streamType);
					});
					addSubscriptions('ice', iceSub);

					const screenSub = connectedClient.subscribe('/user/queue/signal/screen', async (message: IMessage) => {
						const { participants } = parseMessage<ScreenResponseType>(message);
						participants.forEach(async (participant) => {
							await createPeerConnection(participant, offerIceCandidate, 'SCREEN', true);
							const sdp = await createOfferSdp(participant, 'SCREEN');
							await registerOfferSdp(participant, sdp, 'SCREEN');
							sendSdp('/app/signal/offer', participant, sdp, 'SCREEN');
						});
					});
					addSubscriptions('screen', screenSub);

					const errorSub = connectedClient.subscribe('/user/queue/signal/error', async (message: IMessage) => {
						const response = parseMessage<ErrorResponseType>(message);
						onError(response);
					});
					addSubscriptions('error', errorSub);
					const { roomId, setClient } = useClientStore.getState();

					setClient(connectedClient);

					if (roomId) {
						sendJoin(roomId);
					}
				},
				webSocketFactory: () => new SockJS(`http://localhost:8080/ws?userId=${useUserInfoStore.getState().id}`),
			});
			connectedClient.activate();
		},
		[addSubscriptions, offerIceCandidate, sendJoin, sendSdp, onError],
	);

	const shareScreen = useCallback(() => {
		const { client, roomId } = useClientStore.getState();
		const userId = useUserInfoStore.getState().id;
		if (!client || !userId || !roomId) {
			return;
		}

		const payload: ScreenPayloadType = {
			roomId,
		};

		client.publish({
			body: JSON.stringify(payload),
			destination: '/app/signal/screen',
			headers: { 'content-type': 'application/json' },
		});
	}, []);

	const stopScreenShare = useCallback(() => {
		const { client, roomId } = useClientStore.getState();
		const userId = useUserInfoStore.getState().id;

		if (!client || !userId || !roomId) {
			return;
		}

		const payload = {
			ownerId: userId,
			roomId,
		};

		client.publish({
			body: JSON.stringify(payload),
			destination: '/app/signal/leave',
			headers: { 'content-type': 'application/json' },
		});
	}, []);

	const sendChat = useCallback((message: string) => {
		const { client, roomId } = useClientStore.getState();

		if (!client || !roomId) {
			return;
		}

		const payload = {
			message,
			roomId,
		};

		client.publish({
			body: JSON.stringify(payload),
			destination: '/app/chat/send',
			headers: { 'content-type': 'application/json' },
		});
	}, []);

	const sendEmoji = useCallback((emoji: EmojiType) => {
		const { client, roomId } = useClientStore.getState();

		if (!client || !roomId) {
			return;
		}

		const payload = {
			emoji: emoji.toUpperCase(),
			roomId,
		};

		client.publish({
			body: JSON.stringify(payload),
			destination: '/app/emoji',
			headers: { 'content-type': 'application/json' },
		});
	}, []);

	const sendHandUp = useCallback((value: boolean) => {
		const { client, roomId } = useClientStore.getState();

		if (!client || !roomId) {
			return;
		}

		const payload = {
			roomId,
			value,
		};

		client.publish({
			body: JSON.stringify(payload),
			destination: '/app/handUp',
			headers: { 'content-type': 'application/json' },
		});
	}, []);

	const sendDevice = useCallback((mediaOption: DeviceEnableType) => {
		const { client, roomId } = useClientStore.getState();

		if (!client || !roomId) {
			return;
		}
		const payload = {
			mediaOption,
			roomId,
		};

		client.publish({
			body: JSON.stringify(payload),
			destination: '/app/device',
			headers: { 'content-type': 'application/json' },
		});
	}, []);

	const sendLeave = useCallback((streamType: StreamType) => {
		const { clearRoomSubscriptions, client, roomId, setRoomId } = useClientStore.getState();
		if (!client || !useUserInfoStore.getState().id || !roomId) {
			return;
		}

		const payload: LeavePayloadType = {
			roomId,
			streamType,
		};

		client.publish({
			body: JSON.stringify(payload),
			destination: '/app/signal/leave',
			headers: { 'content-type': 'application/json' },
		});

		if (streamType === 'USER') {
			clearRoomSubscriptions();
			setRoomId(null);
		}
	}, []);

	const disconnectSocket = useCallback(() => {
		const { clearSubscriptions, client, setClient, setIsClientReady } = useClientStore.getState();
		if (!client) {
			return;
		}
		clearSubscriptions();
		client.deactivate();
		setClient(null);
		setIsClientReady(null);
	}, []);

	return {
		connectSocket,
		disconnectSocket,
		sendChat,
		sendDevice,
		sendEmoji,
		sendHandUp,
		sendJoin,
		sendLeave,
		shareScreen,
		stopScreenShare,
	};
};

export default useSignalSocket;
