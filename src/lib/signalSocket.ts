'use client';

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { useClientStore } from '@/store/ClientStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { CreateSignalClientType } from '@/type/signalType';

interface CreateSignalClientProps {
	baseUrl: string;
	onConnect?: () => void;
	onError?: () => void;
}

export const createSignalClient = ({ baseUrl, onConnect }: CreateSignalClientProps): CreateSignalClientType => {
	const { clearSubscriptions, setClient, setIsClientReady } = useClientStore.getState();

	const parseMessage = <T>(message: IMessage) => {
		const data = JSON.parse(message.body) as T;
		return data;
	};

	const connect = () => {
		const { id } = useUserInfoStore.getState();
		if (useClientStore.getState().client || !id) {
			return;
		}

		const client = new Client({
			brokerURL: undefined,
			onConnect: () => {
				setClient(client);
				setIsClientReady(true);

				onConnect?.();
			},
			webSocketFactory: () => new SockJS(`${baseUrl}?userId=${id}`),
		});

		client.activate();
	};

	const publish = <T>(destination: string, payload: T) => {
		const { client } = useClientStore.getState();
		if (!client) {
			return;
		}

		client.publish({
			body: JSON.stringify(payload),
			destination,
			headers: {
				'content-type': 'application/json',
			},
		});
	};

	const subscribe = <T>(
		destination: string,
		callback: (responset: T) => Promise<void> | void,
	): StompSubscription | null => {
		const { client } = useClientStore.getState();
		if (!client) return null;

		const sub = client.subscribe(destination, async (message: IMessage) => {
			const response = parseMessage<T>(message);
			await callback(response);
			return sub;
		});
		return sub;
	};

	const signalSub = async <T>(destination: string, callback: (responset: T) => Promise<void> | void) => {
		const { addSubscriptions } = useClientStore.getState();
		const sub = subscribe(destination, callback);
		addSubscriptions(destination, sub);
	};

	const topicSub = <T>(destination: string, callback: (response: T) => Promise<void> | void) => {
		const { addRoomSubscriptions } = useClientStore.getState();
		const sub = subscribe(destination, callback);
		addRoomSubscriptions(destination, sub);
	};

	const disconnect = () => {
		const { client } = useClientStore.getState();
		if (!client) {
			return;
		}

		clearSubscriptions();
		client.deactivate();
		setClient(null);
		setIsClientReady(null);
	};

	return {
		connect,
		disconnect,
		publish,
		signalSub,
		subscribe,
		topicSub,
	};
};
