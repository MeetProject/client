'use client';

import { useCallback } from 'react';

import { useDevice } from '@/hook';
import { setScreenStream, setUserStream } from '@/lib/mediaStream';
import { usePendingTrackStore } from '@/store/TrackInfoStore';
import { useWebRTCStore } from '@/store/WebRTCStore';

const usePeerConnectionEventHandler = () => {
	const { stopScreenStream } = useDevice();

	const onTrack = useCallback((event: RTCTrackEvent) => {
		console.log(event.transceiver.mid);
		const trackId = event.track.id;
		const { deletePendingTrack, pendingTrack, setPendingTrack } = usePendingTrackStore.getState();
		if (pendingTrack.has(trackId)) {
			const { streamType, userId } = pendingTrack.get(trackId);
			deletePendingTrack(trackId);

			if (streamType === 'USER') {
				setUserStream(userId, event.track);
				return;
			}
			setScreenStream(userId, event.track);
			return;
		}
		setPendingTrack(trackId, { track: event.track });
	}, []);

	const onDisplayShareEnd = useCallback(() => {
		const { setScreenOwnerId } = useWebRTCStore.getState();
		stopScreenStream();
		setScreenOwnerId(null);
	}, [stopScreenStream]);

	return {
		onDisplayShareEnd,
		onTrack,
	};
};

export default usePeerConnectionEventHandler;
