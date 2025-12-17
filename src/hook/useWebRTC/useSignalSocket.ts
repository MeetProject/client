'use client';

import { useCallback, useRef } from 'react';

import { SIGNAL_PATH, TOPIC_PATH } from '@/constant/signalPath';
import { createSignalClient } from '@/lib/signalSocket';
import { useClientStore } from '@/store/ClientStore';
import { useDeviceStore } from '@/store/DeviceStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { EmojiType } from '@/type/reactionType';
import {
	ChatPayloadType,
	ChatResponseType,
	CreateSignalClientType,
	DevicePayloadType,
	DeviceResponseType,
	EmojiPayloadType,
	EmojiResponseType,
	handUpPayloadType,
	HandUpResponseType,
	ParticipantResponseType,
	TrackPayloadType,
} from '@/type/signalType';
import { LeaveResponseType, JoinPayloadType } from '@/type/signalType';
import { DeviceEnableType, TrackInfoType } from '@/type/streamType';

interface UseSignalSocketProperties {
	onConnect: (socket: CreateSignalClientType) => void;
	onDevice: (data: DeviceResponseType) => void;
	onChat: (data: ChatResponseType) => void;
	onEmoji: (data: EmojiResponseType) => void;
	onHandUp: (data: HandUpResponseType) => void;
	onLeave: (data: LeaveResponseType) => void;
	onParticipant: (data: ParticipantResponseType) => void;
}

const useSignalSocket = ({
	onChat,
	onConnect,
	onDevice,
	onEmoji,
	onHandUp,
	onLeave,
	onParticipant,
}: UseSignalSocketProperties) => {
	const socket = useRef(
		createSignalClient({
			baseUrl: 'http://localhost:8080',
			debug: true,
			onConnect: () => {
				onConnect(socket.current);
			},
		}),
	);

	const subscribeRoomTopics = useCallback(() => {
		socket.current.topicSub<ParticipantResponseType>(TOPIC_PATH.PARTICIPANT, onParticipant);
		socket.current.topicSub<ChatResponseType>(TOPIC_PATH.CHAT, onChat);
		socket.current.topicSub<EmojiResponseType>(TOPIC_PATH.EMOJI, onEmoji);
		socket.current.topicSub<HandUpResponseType>(TOPIC_PATH.HAND_UP, onHandUp);
		socket.current.topicSub<DeviceResponseType>(TOPIC_PATH.DEVICE, onDevice);
		socket.current.topicSub<LeaveResponseType>(TOPIC_PATH.LEAVE, onLeave);
	}, [onChat, onEmoji, onHandUp, onDevice, onLeave, onParticipant]);

	const sendJoin = useCallback(
		(roomId: string) => {
			const { setRoomId } = useClientStore.getState();
			const { deviceEnable } = useDeviceStore.getState();
			if (!useUserInfoStore.getState().id) {
				return;
			}

			const payload: JoinPayloadType = {
				mediaOption: deviceEnable,
				roomId,
			};

			socket.current.publish('signal', SIGNAL_PATH.JOIN, payload);
			subscribeRoomTopics();
			setRoomId(roomId);
		},
		[subscribeRoomTopics],
	);

	const connectSocket = useCallback(() => {
		socket.current.connect();
	}, []);

	const sendTrack = useCallback((transceiver: Record<string, TrackInfoType>) => {
		const { id } = useUserInfoStore.getState();
		const payload: TrackPayloadType = {
			transceiver,
			userId: id,
		};

		socket.current.publish('signal', SIGNAL_PATH.TRACK, payload);
	}, []);

	const stopScreenShare = useCallback(() => {
		const { roomId } = useClientStore.getState();
		const userId = useUserInfoStore.getState().id;

		if (!userId || !roomId) {
			return;
		}
	}, []);

	const sendChat = useCallback((message: string) => {
		const { roomId } = useClientStore.getState();

		if (!roomId) {
			return;
		}

		const payload: ChatPayloadType = {
			message,
			roomId,
		};

		socket.current.publish('topic', TOPIC_PATH.CHAT, payload);
	}, []);

	const sendEmoji = useCallback((emoji: EmojiType) => {
		const { roomId } = useClientStore.getState();

		if (!roomId) {
			return;
		}

		const payload: EmojiPayloadType = {
			emoji,
			roomId,
		};

		socket.current.publish('topic', TOPIC_PATH.EMOJI, payload);
	}, []);

	const sendHandUp = useCallback((value: boolean) => {
		const { roomId } = useClientStore.getState();

		if (!roomId) {
			return;
		}

		const payload: handUpPayloadType = {
			roomId,
			value,
		};

		socket.current.publish('topic', TOPIC_PATH.HAND_UP, payload);
	}, []);

	const sendDevice = useCallback((mediaOption: DeviceEnableType) => {
		const { roomId } = useClientStore.getState();

		if (!roomId) {
			return;
		}

		const payload: DevicePayloadType = {
			mediaOption,
			roomId,
		};

		socket.current.publish('topic', TOPIC_PATH.DEVICE, payload);
	}, []);

	const sendLeave = useCallback(() => {
		const { clearRoomSubscriptions, roomId, setRoomId } = useClientStore.getState();
		if (!useUserInfoStore.getState().id || !roomId) {
			return;
		}

		socket.current.publish('signal', SIGNAL_PATH.LEAVE);

		clearRoomSubscriptions();
		setRoomId(null);
	}, []);

	const disconnectSocket = useCallback(() => {
		socket.current.disconnect();
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
		sendTrack,
		stopScreenShare,
	};
};

export default useSignalSocket;
