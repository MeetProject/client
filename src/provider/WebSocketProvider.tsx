'use client';

import { PropsWithChildren, useEffect } from 'react';

import { useClientStore } from '@/store/ClientStore';
import { useUserInfoStore } from '@/store/UserInfoStore';

export default function WebSocketProvider({ children }: PropsWithChildren) {
	const { client, roomId } = useClientStore();

	useEffect(() => {
		const handler = () => {
			const { setClient, setIsClientReady } = useClientStore.getState();
			const userId = useUserInfoStore.getState().id;

			if (!userId || !roomId) return;

			const data = new FormData();
			data.append('userId', userId);
			data.append('roomId', roomId);

			navigator.sendBeacon('/api/leave', data);
			client?.deactivate();
			setClient(null);
			setIsClientReady(null);
		};

		if (client) {
			window.addEventListener('beforeunload', handler);
		}
		return () => {
			window.removeEventListener('beforeunload', handler);
		};
	}, [client, roomId]);

	return children;
}
