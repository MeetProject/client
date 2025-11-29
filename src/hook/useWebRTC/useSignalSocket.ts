'use client';

import { useCallback, useRef } from 'react';

import { APP_PATH, TOPIC_PATH } from '@/constant/signalPath';
import { createSignalClient } from '@/lib/signalSocket';
import { useClientStore } from '@/store/ClientStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { EmojiType } from '@/type/reactionType';
import { ChatPayloadType, ChatResponseType, CreateSignalClientType, DevicePayloadType, DeviceResponseType, EmojiPayloadType, EmojiResponseType, handUpPayloadType, HandUpResponseType } from '@/type/signalType';
import {
	LeaveResponseType,
	JoinPayloadType,
	LeavePayloadType,
	StreamType,
	ScreenPayloadType,
	ScreenStopPayloadType,
} from '@/type/signalType';
import { DeviceEnableType } from '@/type/streamType';

interface UseSignalSocketProperties {
	onConnect: (socket: CreateSignalClientType) => void;
	onDevice: (data: DeviceResponseType) => void;
	onChat: (data: ChatResponseType) => void;
	onEmoji: (data: EmojiResponseType) => void;
	onHandUp: (data: HandUpResponseType) => void;
	onLeave: (data: LeaveResponseType ) => void;
}

const useSignalSocket = ({ onChat, onConnect, onDevice, onEmoji, onHandUp, onLeave }: UseSignalSocketProperties) => {
	const socket =  useRef(createSignalClient({
		baseUrl: 'http://localhost:8080/ws',
		onConnect: () => {
			onConnect(socket.current);
		}
	}));

	const sendJoin = useCallback(
		(roomId: string) => {
			const { setRoomId } = useClientStore.getState();
			if ( !useUserInfoStore.getState().id) {
				return;
			}

			const payload: JoinPayloadType = {
				roomId,
			};

			socket.current.publish(APP_PATH.JOIN, payload);

			const { CHAT, DEVICE, EMOJI, HANDUP, LEAVE } = TOPIC_PATH.ROOM(roomId);

			socket.current.topicSub<LeaveResponseType>(LEAVE, onLeave)
			socket.current.topicSub<ChatResponseType>(CHAT, onChat)
			socket.current.topicSub<EmojiResponseType>(EMOJI, onEmoji)
			socket.current.topicSub<HandUpResponseType>(HANDUP, onHandUp)
			socket.current.topicSub<DeviceResponseType>(DEVICE, onDevice)

			setRoomId(roomId);
		},
		[onChat, onEmoji, onLeave, onHandUp, onDevice],
	);

	const connectSocket = useCallback(
		() => {
			socket.current.connect();
		},[],
	);

	const shareScreen = useCallback(() => {
		const { roomId } = useClientStore.getState();
		const userId = useUserInfoStore.getState().id;
		if (!userId || !roomId) {
			return;
		}

		const payload: ScreenPayloadType = {
			roomId,
		};

		socket.current.publish(APP_PATH.SCREEN, payload);
	}, []);

	const stopScreenShare = useCallback(() => {
		const { roomId } = useClientStore.getState();
		const userId = useUserInfoStore.getState().id;

		if ( !userId || !roomId) {
			return;
		}

		const payload: ScreenStopPayloadType = {
			ownerId: userId,
			roomId,
		};

		socket.current.publish(APP_PATH.LEAVE, payload);
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

		socket.current.publish(APP_PATH.CHAT, payload);
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

		socket.current.publish(APP_PATH.EMOJI, payload);
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

		socket.current.publish(APP_PATH.HAND_UP, payload);

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

		socket.current.publish(APP_PATH.DEVICE, payload);
	}, []);

	const sendLeave = useCallback((streamType: StreamType) => {
		const { clearRoomSubscriptions, roomId, setRoomId } = useClientStore.getState();
		if (!useUserInfoStore.getState().id || !roomId) {
			return;
		}

		const payload: LeavePayloadType = {
			roomId,
			streamType,
		};

		socket.current.publish(APP_PATH.LEAVE, payload);

		if (streamType === 'USER') {
			clearRoomSubscriptions();
			setRoomId(null);
		}
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
		shareScreen,
		stopScreenShare,
	};
};

export default useSignalSocket;
