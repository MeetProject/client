'use client';

import { useCallback } from 'react';

import useDevice from '../useDeviceUpdate';

import { useWebRTCStore } from '@/store/WebRTCStore';
import { StreamType } from '@/type/signalType';
import { DeviceEnableType } from '@/type/streamType';

const usePeerConnectionEventHandler = () => {
	const { stopScreenStream } = useDevice();

	const onTrack = useCallback(
		(targetId: string, targetStream: MediaStream, streamType: StreamType, isScreenSender: boolean) => {
			const { setScreenOwnerId, setScreenSharingMediaStream, updateParticipantsMediaStream } =
				useWebRTCStore.getState();

			if (streamType === 'USER') {
				updateParticipantsMediaStream(targetId, targetStream);
			}

			if (streamType === 'SCREEN' && !isScreenSender) {
				setScreenSharingMediaStream(targetStream);
				setScreenOwnerId(targetId);
			}
		},
		[],
	);

	const onDeviceEnableChange = useCallback((id: string, value: DeviceEnableType) => {
		const { updateParticipantsMediaOptions } = useWebRTCStore.getState();
		updateParticipantsMediaOptions(id, value);
	}, []);

	const onDisplayShareEnd = useCallback(() => {
		const { setScreenOwnerId } = useWebRTCStore.getState();
		stopScreenStream();
		setScreenOwnerId(null);
	}, [stopScreenStream]);

	return {
		onDeviceEnableChange,
		onDisplayShareEnd,
		onTrack,
	};
};

export default usePeerConnectionEventHandler;
