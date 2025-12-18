'use client';

import { useCallback } from 'react';

import { SIGNAL_PATH } from '@/constant/signalPath';
import { setScreenStream, setUserStream } from '@/lib/mediaStream';
import { usePendingTrackStore } from '@/store/PendingTrackStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { CreateSignalClientType, IcePayloadType } from '@/type/signalType';

const usePeerConnectionEventHandler = () => {
	const onTrack = useCallback((event: RTCTrackEvent) => {
		const { deletePendingTrack } = usePendingTrackStore.getState();

		const trackInfo = usePendingTrackStore.getState().pendingTrack.get(event.transceiver.mid);
		if (!trackInfo) {
			return;
		}

		const { trackType, userId } = trackInfo;
		deletePendingTrack(event.transceiver.mid);

		if (trackType === 'audio' || trackType === 'video') {
			setUserStream(userId, event.track);
			return;
		}

		setScreenStream(userId, event.track);
	}, []);

	const onNegotiation = useCallback((socket: CreateSignalClientType) => {
		socket.publish('signal', SIGNAL_PATH.NEGOTIATION);
	}, []);

	const onIceCandidate = useCallback((candidate: RTCIceCandidate, socket: CreateSignalClientType) => {
		const { id } = useUserInfoStore.getState();
		if (!id) {
			return;
		}

		console.log('send ice');

		const payload: IcePayloadType = {
			ice: JSON.stringify(candidate),
			userId: id,
		};

		socket.publish('signal', SIGNAL_PATH.ICE, payload);
	}, []);

	return {
		onIceCandidate,
		onNegotiation,
		onTrack,
	};
};

export default usePeerConnectionEventHandler;
