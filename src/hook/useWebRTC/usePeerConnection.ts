'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useDeviceStore } from '@/store/DeviceStore';
import { StreamType } from '@/type/signalType';
import { DeviceEnableType } from '@/type/streamType';

interface UsePeerConnectionProperties {
	onTrack: (targetId: string, stream: MediaStream, type: 'SCREEN' | 'USER', isScreenSender: boolean) => void;
	onDisplayShareEnd: () => void;
	onDeviceEnableChange: (id: string, value: DeviceEnableType) => void;
}

interface PeerConnectionData {
	pc: RTCPeerConnection;
	iceQueue: RTCIceCandidateInit[];
	remoteSet: boolean;
}

const usePeerConnection = ({ onDeviceEnableChange, onDisplayShareEnd, onTrack }: UsePeerConnectionProperties) => {
	const peerConnections = useRef<Map<string, PeerConnectionData>>(new Map());
	const screenPeerConnections = useRef<Map<string, PeerConnectionData>>(new Map());
	const { deviceEnable, stream } = useDeviceStore(
		useShallow((state) => ({
			deviceEnable: state.deviceEnable,
			stream: state.stream,
		})),
	);

	const createPeerConnection = useCallback(
		async (
			targetId: string,
			onIceCandidate: (targetId: string, candidate: RTCIceCandidate, streamType: StreamType) => void,
			streamType: 'SCREEN' | 'USER',
			isScreenSender = false,
		) => {
			console.log(`[PeerConnection] create start for user: ${targetId}`);
			const connections = streamType === 'SCREEN' ? screenPeerConnections : peerConnections;

			const existingPC = peerConnections.current.get(targetId);
			console.log(`[PeerConnection] create start for user: ${targetId}, existing pc:`, existingPC);

			if (existingPC) {
				console.warn(`[PeerConnection] warning: existing peerConnection detected for ${targetId}, closing it.`);
				existingPC.pc.close();
				peerConnections.current.delete(targetId);
			}

			const pc = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
			});

			const data: PeerConnectionData = {
				iceQueue: [],
				pc,
				remoteSet: false,
			};

			pc.onicecandidate = async (event) => {
				if (event.candidate) {
					console.log(`[PeerConnection] ICE candidate generated for ${targetId}`, event.candidate);
					await onIceCandidate(targetId, event.candidate, streamType);
				}
			};

			pc.ontrack = async (event) => {
				if (!isScreenSender) {
					console.log(`[PeerConnection] ontrack event for ${targetId}`, event.streams);
					event.streams.forEach((s) => {
						s.getTracks().forEach((t) => {
							console.log(`[ontrack] track received for ${targetId}`, t.kind, t.id);
						});
					});
					const remoteStream = event.streams[0];
					console.log(remoteStream);
					onTrack(targetId, remoteStream, streamType, isScreenSender);
				}
			};

			console.log(streamType, 'create');

			if (streamType === 'SCREEN' && isScreenSender) {
				const { screenStream: mediaStream } = useDeviceStore.getState();
				mediaStream?.getTracks().forEach((track) => pc.addTrack(track, mediaStream));
				connections.current.set(targetId, data);
				onTrack(targetId, mediaStream, 'SCREEN', true);

				mediaStream.getVideoTracks()[0].onended = () => {
					onDisplayShareEnd();
				};
				return;
			}

			const { stream: mediaStream } = useDeviceStore.getState();

			console.log(mediaStream);
			console.log(mediaStream?.getTracks());

			mediaStream?.getTracks().forEach((track) => {
				console.log(`[attach] track id: ${track.id}`);
				pc.addTrack(track, mediaStream);
			});
			connections.current.set(targetId, data);
			console.log(`[PeerConnection] create done for user: ${targetId}`);
		},
		[onDisplayShareEnd, onTrack],
	);

	const createOfferSdp = useCallback(async (targetId: string, streamType: StreamType) => {
		const peerConnection = streamType === 'USER' ? peerConnections.current : screenPeerConnections.current;
		const target = peerConnection.get(targetId);
		if (!target) return;
		return target.pc.createOffer();
	}, []);

	const createAnswerSdp = useCallback(async (targetId: string, streamType: StreamType) => {
		const peerConnection = streamType === 'USER' ? peerConnections.current : screenPeerConnections.current;
		const target = peerConnection.get(targetId);
		if (!target) return;
		return target.pc.createAnswer();
	}, []);

	const registerOfferSdp = async (targetId: string, sdp: RTCSessionDescriptionInit, streamType: StreamType) => {
		const peerConnection = streamType === 'USER' ? peerConnections.current : screenPeerConnections.current;
		const target = peerConnection.get(targetId);
		if (!target) return;
		console.log(`[SDP] registerOfferSdp start for ${targetId}`, sdp.type);
		console.log('[SDP] sdp content snippet:', sdp.sdp?.substring(0, 500));
		await target.pc.setLocalDescription(sdp);
		console.log(`[SDP] registerOfferSdp done for ${targetId}`);
	};

	const registerAnswerSdp = useCallback(
		async (
			targetId: string,
			targetSdp: RTCSessionDescriptionInit,
			streamType: StreamType,
			mediaOption?: DeviceEnableType,
		) => {
			const peerConnection = streamType === 'USER' ? peerConnections.current : screenPeerConnections.current;
			const target = peerConnection.get(targetId);
			if (!target) return;

			console.log(`[SDP] registerAnswerSdp start for ${targetId}`, targetSdp.type);
			console.log('[SDP] sdp content snippet:', targetSdp.sdp?.substring(0, 500));

			if (streamType === 'USER' && mediaOption) {
				onDeviceEnableChange(targetId, mediaOption);
			}

			await target.pc.setRemoteDescription(targetSdp);
			console.log(`[SDP] registerAnswerSdp done for ${targetId}`);
			target.remoteSet = true;

			target.iceQueue.forEach(async (ice) => {
				await target.pc.addIceCandidate(new RTCIceCandidate(ice));
			});
			target.iceQueue = [];
		},
		[onDeviceEnableChange],
	);

	const registerRemoteIce = useCallback(
		async (targetId: string, targetIce: RTCIceCandidateInit, streamType: StreamType) => {
			const peerConnection = streamType === 'USER' ? peerConnections.current : screenPeerConnections.current;
			const target = peerConnection.get(targetId);
			console.log('registering ice');
			if (!target) return;

			if (!target.remoteSet) {
				target.iceQueue.push(targetIce);
			} else {
				await target.pc.addIceCandidate(new RTCIceCandidate(targetIce));
			}
		},
		[],
	);

	const disconnectPeerConnection = useCallback((targetId: string, streamType: StreamType) => {
		const peerConnection = streamType === 'USER' ? peerConnections.current : screenPeerConnections.current;
		const target = peerConnection.get(targetId);
		if (!target) return;

		target.pc.close();
		peerConnection.delete(targetId);
	}, []);

	const disconnectAllPeerConnection = useCallback(() => {
		peerConnections.current.forEach((data) => data.pc.close());
		peerConnections.current.clear();
	}, []);

	const disconnectAllScreenPeerConnection = useCallback(() => {
		screenPeerConnections.current.forEach((data) => {
			data.pc.close();
			data.pc = null;
		});
		screenPeerConnections.current.clear();
	}, []);

	useEffect(() => {
		if (peerConnections.current.size === 0) return;

		peerConnections.current.forEach((data) => {
			data.pc.getSenders().forEach((sender) => {
				if (sender.track?.kind === 'video') sender.track.enabled = deviceEnable.video;
				if (sender.track?.kind === 'audio') sender.track.enabled = deviceEnable.audio;
			});
		});
	}, [deviceEnable]);

	useEffect(() => {
		if (!stream) return;

		const replaceTracks = async () => {
			peerConnections.current.forEach((data) => {
				data.pc.getSenders().forEach((sender) => {
					const newTrack = stream?.getTracks().find((t) => t.kind === sender.track?.kind);
					if (newTrack) {
						sender.replaceTrack(newTrack);
					}
				});
			});
		};

		replaceTracks();
	}, [stream]);

	return {
		createAnswerSdp,
		createOfferSdp,
		createPeerConnection,
		disconnectAllPeerConnection,
		disconnectAllScreenPeerConnection,
		disconnectPeerConnection,
		peerConnections,
		registerAnswerSdp,
		registerOfferSdp,
		registerRemoteIce,
	};
};

export default usePeerConnection;
