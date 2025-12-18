'use client';

import { useCallback, useRef } from 'react';

import usePeerConnectionEventHandler from '@/hook/useWebRTC/usePeerConnectionEventHandler';
import { useDeviceStore } from '@/store/DeviceStore';
import { usePendingTrackStore } from '@/store/PendingTrackStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { CreateSignalClientType } from '@/type/signalType';
import { TrackType } from '@/type/streamType';

interface PeerConnectionData {
	pc: RTCPeerConnection;
	iceQueue: RTCIceCandidate[];
}

const usePeerConnection = () => {
	const { onIceCandidate, onNegotiation, onTrack } = usePeerConnectionEventHandler();

	const isMakingOffer = useRef<boolean>(false);
	const peerConnections = useRef<PeerConnectionData>({
		iceQueue: [],
		pc: null,
	});

	const negotiationTimer = useRef<NodeJS.Timeout | null>(null);

	const createPeerConnection = useCallback(
		async (socket: CreateSignalClientType) => {
			if (peerConnections.current.pc) {
				peerConnections.current.pc.close();
				peerConnections.current = {
					iceQueue: [],
					pc: null,
				};
			}

			const pc = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
			});

			pc.onicecandidate = async (event) => {
				if (!event.candidate) {
					return;
				}

				if (pc.signalingState !== 'stable') {
					peerConnections.current.iceQueue.push(event.candidate);
					return;
				}

				if (peerConnections.current.iceQueue.length !== 0) {
					await Promise.all(
						peerConnections.current.iceQueue.map(async (ice) => {
							await onIceCandidate(ice, socket);
						}),
					);
					peerConnections.current.iceQueue = [];
				}

				await onIceCandidate(event.candidate, socket);
			};

			pc.ontrack = async (event) => {
				onTrack(event);
				console.log('getTrack');
			};

			pc.onnegotiationneeded = async () => {
				if (pc.signalingState !== 'stable') {
					return;
				}

				console.log('negotiation');

				if (negotiationTimer.current) {
					clearTimeout(negotiationTimer.current);
				}

				negotiationTimer.current = setTimeout(async () => {
					negotiationTimer.current = null;
					if (isMakingOffer.current) {
						return;
					}
					console.log('aaa');
					isMakingOffer.current = true;
					await onNegotiation(socket);
				}, 100);
			};

			const { id } = useUserInfoStore.getState();
			const { stream: mediaStream } = useDeviceStore.getState();
			const { addSenderTrack } = usePendingTrackStore.getState();

			mediaStream.getTracks().forEach((track) => {
				addSenderTrack(track.id, {
					trackType: track.kind as TrackType,
					userId: id,
				});
			});

			peerConnections.current.pc = pc;
		},
		[onTrack, onNegotiation, onIceCandidate],
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

		peerConnections.current.pc.getTransceivers().forEach((t) => {
			console.log(
				`Mid: ${t.mid}, Direction: ${t.direction}, Current: ${t.currentDirection}, Track: ${t.sender.track?.label}`,
			);
		});
	};

	const registerRemoteSdp = useCallback(async (targetSdp: RTCSessionDescriptionInit) => {
		const target = peerConnections.current;

		await target.pc.setRemoteDescription(targetSdp);

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

		await target.pc.addIceCandidate(new RTCIceCandidate(targetIce));
	}, []);

	const registerTrack = async (track: MediaStreamTrack) => {
		const pc = peerConnections.current.pc;
		console.log('송출 전 트랙 상태:', track.label, track.readyState, track.enabled);

		const transceiver = pc
			.getTransceivers()
			.find(
				(t) =>
					t.mid !== null &&
					t.direction === 'recvonly' &&
					t.sender.track === null &&
					t.receiver.track.kind === track.kind,
			);

		if (!transceiver) {
			throw new Error(`No available ${track.kind} sendonly transceiver`);
		}

		transceiver.direction = 'sendonly';
		await transceiver.sender.replaceTrack(track);
		return transceiver.mid!;
	};

	const disconnectPeerConnection = useCallback(() => {
		const target = peerConnections.current;
		if (!target.pc) {
			return;
		}

		target.pc.close();

		peerConnections.current = {
			iceQueue: [],
			pc: null,
		};
	}, []);

	const getTrack = (mid: string) => {
		const transceiver = peerConnections.current.pc.getTransceivers().find((t) => t.mid === mid && t.receiver.track);
		return transceiver?.receiver.track;
	};

	/* useEffect(() => {
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
	}, [stream]); */

	return {
		createAnswerSdp,
		createOfferSdp,
		createPeerConnection,
		disconnectPeerConnection,
		getTrack,
		peerConnections,
		registerLocalSdp,
		registerRemoteIce,
		registerRemoteSdp,
		registerTrack,
	};
};

export default usePeerConnection;
