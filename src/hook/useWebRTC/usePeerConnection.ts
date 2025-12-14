'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import usePeerConnectionEventHandler from '@/hook/useWebRTC/usePeerConnectionEventHandler';
import { useDeviceStore } from '@/store/DeviceStore';
import { CreateSignalClientType } from '@/type/signalType';

interface PeerConnectionData {
	pc: RTCPeerConnection;
	iceQueue: RTCIceCandidateInit[];
	remoteSet: boolean;
}

const usePeerConnection = () => {
	const { onIceCandidate, onNegotiation, onTrack, registerTrack } = usePeerConnectionEventHandler();

	const isMakingOffer = useRef<boolean>(false);
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
		async (socket: CreateSignalClientType, userId: string) => {
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
				if (!event.candidate) {
					return;
				}
				await onIceCandidate(event.candidate, socket);
			};

			pc.ontrack = async (event) => {
				onTrack(event);
			};

			pc.onnegotiationneeded = async () => {
				if (pc.signalingState !== 'stable' || isMakingOffer.current) {
					return;
				}

				isMakingOffer.current = true;
				peerConnections.current.remoteSet = false;
				onNegotiation(pc, socket, userId);
			};

			registerTrack(pc, socket);

			peerConnections.current.pc = pc;
		},
		[onTrack, onNegotiation, registerTrack, onIceCandidate],
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
		isMakingOffer.current = false;
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
