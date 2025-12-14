'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { APP_PATH } from '@/constant/signalPath';
import { useDeviceStore } from '@/store/DeviceStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { CreateSignalClientType, TrackPayloadType } from '@/type/signalType';
import { TrackInfoType } from '@/type/streamType';

interface UsePeerConnectionProperties {
	onTrack: (event: RTCTrackEvent) => void;
}

interface PeerConnectionData {
	pc: RTCPeerConnection;
	iceQueue: RTCIceCandidateInit[];
	remoteSet: boolean;
}

const usePeerConnection = ({ onTrack }: UsePeerConnectionProperties) => {
	const peerConnections = useRef<PeerConnectionData>({
		iceQueue: [],
		pc: null,
		remoteSet: false,
	});

	const { deviceEnable, stream } = useDeviceStore(
		useShallow((state) => ({
			deviceEnable: state.deviceEnable,
			stream: state.stream,
		})),
	);

	const createPeerConnection = useCallback(
		async (socket: CreateSignalClientType, onIceCandidate: (candidate: RTCIceCandidate) => void) => {
			if (peerConnections.current.pc) {
				peerConnections.current.pc.close();
				peerConnections.current = {
					iceQueue: [],
					pc: null,
					remoteSet: false,
				};
			}

			const pc = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
			});

			pc.onicecandidate = async (event) => {
				if (event.candidate) {
					await onIceCandidate(event.candidate);
				}
			};

			pc.ontrack = async (event) => {
				onTrack(event);
				console.log(event);
			};

			pc.onnegotiationneeded = () => {};

			const { stream: mediaStream } = useDeviceStore.getState();
			const { id } = useUserInfoStore.getState();

			const trackInfo = new Map<string, TrackInfoType>();

			mediaStream?.getTracks().forEach((track) => {
				pc.addTransceiver(track);
				trackInfo.set(track.id, { streamType: 'USER', userId: id });
			});

			const payload: TrackPayloadType = {
				track: Object.fromEntries(trackInfo),
				userId: id,
			};

			socket.publish(APP_PATH.TRACK, payload);

			peerConnections.current.pc = pc;
		},
		[onTrack],
	);

	const createOfferSdp = useCallback(async () => {
		const target = peerConnections.current;
		if (!target.pc) {
			return;
		}
		return target.pc.createOffer();
	}, []);

	const createAnswerSdp = useCallback(async () => {
		const target = peerConnections.current;
		if (!target.pc) {
			return;
		}
		return target.pc.createAnswer();
	}, []);

	const registerLocalSdp = async (sdp: RTCSessionDescriptionInit) => {
		const target = peerConnections.current;
		if (!target.pc) {
			return;
		}
		await target.pc.setLocalDescription(sdp);
	};

	const registerRemoteSdp = useCallback(async (targetSdp: RTCSessionDescriptionInit) => {
		const target = peerConnections.current;

		await target.pc.setRemoteDescription(targetSdp);
		target.remoteSet = true;

		target.iceQueue.forEach(async (ice) => {
			await target.pc.addIceCandidate(new RTCIceCandidate(ice));
		});
		target.iceQueue = [];
	}, []);

	const registerRemoteIce = useCallback(async (targetIce: RTCIceCandidateInit) => {
		const target = peerConnections.current;
		if (!target.pc) {
			return;
		}

		if (!target.remoteSet) {
			target.iceQueue.push(targetIce);
		} else {
			await target.pc.addIceCandidate(new RTCIceCandidate(targetIce));
		}
	}, []);

	const disconnectPeerConnection = useCallback(() => {
		const target = peerConnections.current;
		if (!target.pc) {
			return;
		}

		target.pc.close();

		peerConnections.current = {
			iceQueue: [],
			pc: null,
			remoteSet: false,
		};
	}, []);

	useEffect(() => {
		peerConnections.current.pc?.getSenders().forEach((sender) => {
			if (sender.track?.kind === 'video') sender.track.enabled = deviceEnable.video;
			if (sender.track?.kind === 'audio') sender.track.enabled = deviceEnable.audio;
		});
	}, [deviceEnable]);

	useEffect(() => {
		if (!stream) return;

		const replaceTracks = async () => {
			peerConnections.current.pc?.getSenders().forEach((sender) => {
				const newTrack = stream?.getTracks().find((t) => t.kind === sender.track?.kind);
				if (newTrack) {
					sender.replaceTrack(newTrack);
				}
			});
		};

		replaceTracks();
	}, [stream]);

	return {
		createAnswerSdp,
		createOfferSdp,
		createPeerConnection,
		disconnectPeerConnection,
		peerConnections,
		registerLocalSdp,
		registerRemoteIce,
		registerRemoteSdp,
	};
};

export default usePeerConnection;
