'use client';

import { useCallback } from 'react';

import { APP_PATH } from '@/constant/signalPath';
import { setScreenStream, setUserStream } from '@/lib/mediaStream';
import { useDeviceStore } from '@/store/DeviceStore';
import { usePendingTrackStore } from '@/store/TrackInfoStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { CreateSignalClientType, IcePayloadType, OfferPayloadType, TrackPayloadType } from '@/type/signalType';
import { TrackInfoType } from '@/type/streamType';

const usePeerConnectionEventHandler = () => {
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

	const onNegotiation = useCallback(async (pc: RTCPeerConnection, socket: CreateSignalClientType, userId: string) => {
		const sdp = await pc.createOffer();
		await pc.setLocalDescription(sdp);
		const payload: OfferPayloadType = {
			sdp: JSON.stringify(sdp),
			userId,
		};
		socket.publish(APP_PATH.OFFER, payload);
	}, []);

	const onIceCandidate = useCallback((candidate: RTCIceCandidate, socket: CreateSignalClientType) => {
		const { id } = useUserInfoStore.getState();
		if (!id) {
			return;
		}

		const payload: IcePayloadType = {
			ice: JSON.stringify(candidate),
			userId: id,
		};

		socket.publish(APP_PATH.ICE, payload);
	}, []);

	const registerTrack = useCallback((pc: RTCPeerConnection, socket: CreateSignalClientType) => {
		const { stream: mediaStream } = useDeviceStore.getState();
		const { id } = useUserInfoStore.getState();

		const trackInfo = new Map<string, TrackInfoType>();
		mediaStream?.getTracks().forEach((track) => {
			pc.addTransceiver(track);
			trackInfo.set(track.id, { streamType: 'USER', userId: id });
		});

		if (trackInfo.size === 0) {
			return;
		}

		const payload: TrackPayloadType = {
			track: Object.fromEntries(trackInfo),
			userId: id,
		};

		socket.publish(APP_PATH.TRACK, payload);
	}, []);

	return {
		onIceCandidate,
		onNegotiation,
		onTrack,
		registerTrack,
	};
};

export default usePeerConnectionEventHandler;
