'use client';

import { useCallback } from 'react';

import useDevice from '../useDeviceUpdate';

import { useWebRTCStore } from '@/store/WebRTCStore';

const usePeerConnectionEventHandler = () => {
	const { stopScreenStream } = useDevice();

	const onTrack = useCallback((event: RTCTrackEvent) => {
		/* const { setScreenOwnerId, setScreenSharingMediaStream, updateParticipantsMediaStream } = useWebRTCStore.getState();
		 */
		console.log(event.streams[0]);
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
