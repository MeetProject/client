'use client';

import { useCallback } from 'react';

import { SIGNAL_PATH } from '@/constant/signalPath';
import { setScreenStream, setUserStream } from '@/lib/mediaStream';
import { usePendingTrackStore } from '@/store/PendingTrackStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { CreateSignalClientType, IcePayloadType, OfferPayloadType, StreamType } from '@/type/signalType';
import { getTrackType } from '@/util/trackType';

const usePeerConnectionEventHandler = () => {
	const onTrack = useCallback((event: RTCTrackEvent) => {
		const mid = event.transceiver.mid;
		const { deletePendingTrack, pendingTrack, setPendingTrack } = usePendingTrackStore.getState();
		if (pendingTrack.has(mid)) {
			const { streamType, userId } = pendingTrack.get(mid);
			deletePendingTrack(mid);

			if (streamType === 'USER') {
				setUserStream(userId, event.track);
				return;
			}
			setScreenStream(userId, event.track);
			return;
		}
		setPendingTrack(mid, { track: event.track });
	}, []);

	const onNegotiation = useCallback(async (pc: RTCPeerConnection, socket: CreateSignalClientType) => {
		const { id } = useUserInfoStore.getState();
		if (!id) {
			return;
		}
		const sdp = await pc.createOffer();
		await pc.setLocalDescription(sdp);
		const payload: OfferPayloadType = {
			sdp: JSON.stringify(sdp),
			userId: id,
		};
		socket.publish('signal', SIGNAL_PATH.OFFER, payload);
		console.log('sending offer', payload);
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

		socket.publish('signal', SIGNAL_PATH.ICE, payload);
	}, []);

	const registerTrack = (stream: MediaStream, pc: RTCPeerConnection, streamType: StreamType) => {
		const { setTransceiver } = usePendingTrackStore.getState();

		stream?.getTracks().forEach((track) => {
			const transceiver = pc.addTransceiver(track, { direction: 'sendonly' });
			const trackType = getTrackType(streamType, track.kind);
			setTransceiver(trackType, transceiver);
		});
	};

	return {
		onIceCandidate,
		onNegotiation,
		onTrack,
		registerTrack,
	};
};

export default usePeerConnectionEventHandler;
