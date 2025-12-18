'use client';

import { useClientStore } from '@/store/ClientStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { CreateSignalClientType, SignalEventType } from '@/type/signalType';

interface CreateSignalClientProps {
	baseUrl: string;
	onConnect?: () => void;
	onError?: () => void;
	debug?: boolean;
}

export const createSignalClient = ({ baseUrl, debug, onConnect }: CreateSignalClientProps): CreateSignalClientType => {
	const { clearSubscriptions, setClient, setIsClientReady } = useClientStore.getState();

	const getRawData = (e: MessageEvent) => {
		if (e.data instanceof ArrayBuffer) {
			return new TextDecoder('utf-8').decode(e.data);
		}

		if (typeof e.data === 'string') {
			return e.data;
		}

		throw new Error('unspoorted message type');
	};

	const connect = () => {
		const { id } = useUserInfoStore.getState();
		if (useClientStore.getState().client || !id) {
			return;
		}
		setIsClientReady(false);

		const ws = new WebSocket(`${baseUrl}/ws?userId=${id}`);

		ws.binaryType = 'arraybuffer';

		ws.onopen = () => {
			if (debug) {
				console.log('socket connect!');
			}
			setClient(ws);
			setIsClientReady(true);
			onConnect?.();
		};

		ws.onerror = (e) => {
			console.log(e);
		};

		ws.onmessage = async (e) => {
			const raw = getRawData(e);
			const data = JSON.parse(raw) as SignalEventType<any>;
			const { path, payload, type } = data;

			if (debug) {
				console.log();
				console.log('<< get Message');
				console.log('type: ', type);
				console.log('path: ', path);
				console.log('payload: ');
				console.log(payload);
				console.log();
			}

			const { roomSubscriptions, subscriptions } = useClientStore.getState();
			const subscription = type === 'signal' ? subscriptions.get(path) : roomSubscriptions.get(path);

			if (!subscription || subscription.size === 0) {
				return;
			}

			await Promise.all([...subscription].map((callback) => callback(payload)));
		};
	};

	const publish = <T>(type: 'signal' | 'topic', path: string, payload: T) => {
		const { client, isClientReady } = useClientStore.getState();
		if (!client || client.readyState !== WebSocket.OPEN || !isClientReady) {
			return;
		}

		if (debug) {
			console.log();
			console.log('send Message >>');
			console.log('type: ', type);
			console.log('path: ', path);
			console.log('payload: ');
			console.log(payload);
			console.log();
		}

		client.send(Buffer.from(JSON.stringify({ path, payload, type })));
	};

	const signalSub = async <T>(path: string, callback: (responset: T) => Promise<void> | void) => {
		const { addSubscriptions } = useClientStore.getState();
		addSubscriptions(path, callback);
	};

	const topicSub = <T>(path: string, callback: (response: T) => Promise<void> | void) => {
		const { addRoomSubscriptions } = useClientStore.getState();
		addRoomSubscriptions(path, callback);
	};

	const disconnect = () => {
		const { client } = useClientStore.getState();
		if (!client) {
			return;
		}

		clearSubscriptions();
		client.close();
		setClient(null);
		setIsClientReady(false);
	};

	return {
		connect,
		disconnect,
		publish,
		signalSub,
		topicSub,
	};
};
