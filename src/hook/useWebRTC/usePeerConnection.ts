'use client';

import { MutableRefObject, useEffect, useRef } from 'react';
import { useDeviceStore } from '@/store/DeviceStore';
import { useShallow } from 'zustand/react/shallow';
import { StreamType } from '@/type/signalType';

interface UsePeerConnectionProps {
  streamRef: MutableRefObject<MediaStream>;
  screenStreamRef: MutableRefObject<MediaStream>;
  onTrack: (targetId: string, stream: MediaStream, type: 'SCREEN' | 'USER', isScreenSender: boolean) => void;
  onDisplayShareEnd: () => void;
}

interface PeerConnectionData {
  pc: RTCPeerConnection;
  iceQueue: RTCIceCandidateInit[];
  remoteSet: boolean;
}

const usePeerConnection = ({ streamRef, screenStreamRef, onTrack, onDisplayShareEnd }: UsePeerConnectionProps) => {
  const peerConnections = useRef<Map<string, PeerConnectionData>>(new Map());
  const screenPeerConnections = useRef<Map<string, PeerConnectionData>>(new Map());
  const { deviceEnable } = useDeviceStore(
    useShallow((state) => ({
      deviceEnable: state.deviceEnable,
    })),
  );

  console.log(peerConnections.current);
  console.log(screenPeerConnections.current);

  const replaceTracks = async (stream: MediaStream) => {
    peerConnections.current.forEach((data) => {
      data.pc.getSenders().forEach((sender) => {
        const newTrack = stream.getTracks().find((t) => t.kind === sender.track?.kind);
        if (newTrack) {
          sender.replaceTrack(newTrack);
        }
      });
    });
  };

  const createPeerConnection = async (
    targetId: string,
    onIceCandidate: (targetId: string, candidate: RTCIceCandidate, streamType: StreamType) => void,
    streamType: 'SCREEN' | 'USER',
    isScreenSender = false,
  ) => {
    const connections = streamType === 'SCREEN' ? screenPeerConnections : peerConnections;
    if (connections.current.has(targetId)) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    const data: PeerConnectionData = {
      pc,
      iceQueue: [],
      remoteSet: false,
    };

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await onIceCandidate(targetId, event.candidate, streamType);
      }
    };

    pc.ontrack = async (event) => {
      if (!isScreenSender) {
        const remoteStream = event.streams[0];
        onTrack(targetId, remoteStream, streamType, isScreenSender);
      }
    };

    if (streamType === 'SCREEN' && isScreenSender) {
      screenStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, screenStreamRef.current));
      connections.current.set(targetId, data);
      onTrack(targetId, screenStreamRef.current, 'SCREEN', true);

      screenStreamRef.current.getVideoTracks()[0].onended = () => {
        onDisplayShareEnd();
      };
      return;
    }

    streamRef.current.getTracks().forEach((track) => pc.addTrack(track, streamRef.current));
    connections.current.set(targetId, data);
  };

  const createOfferSdp = async (targetId: string, streamType: StreamType) => {
    const peerConnection = streamType === 'USER' ? peerConnections.current : screenPeerConnections.current;
    const target = peerConnection.get(targetId);
    if (!target) return;
    return target.pc.createOffer();
  };

  const createAnswerSdp = async (targetId: string, streamType: StreamType) => {
    const peerConnection = streamType === 'USER' ? peerConnections.current : screenPeerConnections.current;
    const target = peerConnection.get(targetId);
    if (!target) return;
    return target.pc.createAnswer();
  };

  const registerOfferSdp = async (targetId: string, sdp: RTCSessionDescriptionInit, streamType: StreamType) => {
    const peerConnection = streamType === 'USER' ? peerConnections.current : screenPeerConnections.current;
    const target = peerConnection.get(targetId);
    if (!target) return;
    await target.pc.setLocalDescription(sdp);
  };

  const registerAnswerSdp = async (targetId: string, targetSdp: RTCSessionDescriptionInit, streamType: StreamType) => {
    const peerConnection = streamType === 'USER' ? peerConnections.current : screenPeerConnections.current;
    const target = peerConnection.get(targetId);
    if (!target) return;

    if (target.pc.signalingState !== 'stable' && target.pc.signalingState !== 'have-local-offer') return;

    await target.pc.setRemoteDescription(targetSdp);
    target.remoteSet = true;

    target.iceQueue.forEach(async (ice) => {
      await target.pc.addIceCandidate(new RTCIceCandidate(ice));
    });
    target.iceQueue = [];
  };

  const registerRemoteIce = async (targetId: string, targetIce: RTCIceCandidateInit, streamType: StreamType) => {
    const peerConnection = streamType === 'USER' ? peerConnections.current : screenPeerConnections.current;
    const target = peerConnection.get(targetId);
    if (!target) return;

    if (!target.remoteSet) {
      target.iceQueue.push(targetIce);
    } else {
      await target.pc.addIceCandidate(new RTCIceCandidate(targetIce));
    }
  };

  const disconnectPeerConnection = (targetId: string, streamType: StreamType) => {
    const peerConnection = streamType === 'USER' ? peerConnections.current : screenPeerConnections.current;
    const target = peerConnection.get(targetId);
    if (!target) return;

    target.pc.close();
    peerConnection.delete(targetId);
  };

  const disconnectAllPeerConnection = () => {
    peerConnections.current.forEach((data) => data.pc.close());
    peerConnections.current.clear();
  };

  const disconnectAllScreenPeerConnection = () => {
    screenPeerConnections.current.forEach((data) => data.pc.close());
    screenPeerConnections.current.clear();
  };

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
    const handleDeviceChange = async () => {
      if (!streamRef.current) return;

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: deviceEnable.audio,
          video: deviceEnable.video,
        });

        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = newStream;

        await replaceTracks(newStream);
      } catch (err) {
        console.error('Device change error:', err);
      }
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [deviceEnable, streamRef]);

  return {
    createPeerConnection,
    createOfferSdp,
    createAnswerSdp,
    registerOfferSdp,
    registerAnswerSdp,
    registerRemoteIce,
    peerConnections,
    disconnectPeerConnection,
    disconnectAllPeerConnection,
    disconnectAllScreenPeerConnection,
  };
};

export default usePeerConnection;
