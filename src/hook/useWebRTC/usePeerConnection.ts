'use client';

import { useEffect, useRef } from 'react';
import { useDeviceStore } from '@/store/DeviceStore';
import { useShallow } from 'zustand/react/shallow';
import { StreamType } from '@/type/signalType';

interface UsePeerConnectionProps {
  stream: MediaStream;
  getScreenStream: (audio: boolean) => Promise<MediaStream>;
  onTrack: (targetId: string, stream: MediaStream, type: 'SCREEN' | 'USER', isScreenSender?: boolean) => void;
  onDisplayShareEnd: () => void;
}

interface PeerConnectionData {
  pc: RTCPeerConnection;
  iceQueue: RTCIceCandidateInit[];
  remoteSet: boolean;
}

const usePeerConnection = ({ stream, getScreenStream, onTrack, onDisplayShareEnd }: UsePeerConnectionProps) => {
  const peerConnections = useRef<Map<string, PeerConnectionData>>(new Map());
  const screenPeerConnections = useRef<Map<string, PeerConnectionData>>(new Map());
  const { deviceEnable } = useDeviceStore(
    useShallow((state) => ({
      deviceEnable: state.deviceEnable,
    })),
  );

  const createPeerConnection = async (
    targetId: string,
    onIceCandidate: (targetId: string, candidate: RTCIceCandidate, streamType: StreamType) => void,
    streamType: 'SCREEN' | 'USER',
    isScreenSender = false,
  ) => {
    const connections = streamType === 'SCREEN' ? screenPeerConnections : peerConnections;
    if (connections.current.has(targetId)) {
      return;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    const data = {
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
        onTrack(targetId, remoteStream, streamType);
      }
    };

    console.log(streamType, isScreenSender);

    if (isScreenSender) {
      const screenStream = await getScreenStream(true);
      screenStream.getTracks().forEach((track) => {
        pc.addTrack(track, screenStream);
      });
      connections.current.set(targetId, data);
      onTrack(targetId, screenStream, 'SCREEN', true);

      screenStream.getVideoTracks()[0].onended = () => {
        onDisplayShareEnd();
      };
      return;
    }
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    connections.current.set(targetId, data);
  };

  const createOfferSdp = async (targetId: string, streamType: StreamType): Promise<RTCSessionDescriptionInit> => {
    const peerConnection = streamType === 'USER' ? peerConnections.current : screenPeerConnections.current;
    const target = peerConnection.get(targetId);

    if (!target) return;

    const offer = await target.pc.createOffer();
    return offer;
  };

  const createAnswerSdp = async (targetId: string, streamType: StreamType): Promise<RTCSessionDescriptionInit> => {
    const peerConnection = streamType === 'USER' ? peerConnections.current : screenPeerConnections.current;
    const target = peerConnection.get(targetId);

    if (!target) return;

    const answer = await target.pc.createAnswer();
    return answer;
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

    if (target.pc.signalingState !== 'stable' && target.pc.signalingState !== 'have-local-offer') {
      return;
    }

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
    peerConnections.current.forEach((peerConnection) => {
      peerConnection.pc.close();
    });

    peerConnections.current.clear();
  };

  const disconnectAllScreenPeerConnection = () => {
    screenPeerConnections.current.forEach((peerConnection) => {
      peerConnection.pc.close();
    });

    screenPeerConnections.current.clear();
  };

  useEffect(() => {
    if (!stream || peerConnections.current.size === 0) return;

    peerConnections.current.forEach((data) => {
      data.pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video') {
          const newTrack = stream.getVideoTracks()[0];
          if (newTrack) sender.replaceTrack(newTrack);
        } else if (sender.track?.kind === 'audio') {
          const newTrack = stream.getAudioTracks()[0];
          if (newTrack) sender.replaceTrack(newTrack);
        }
      });
    });
  }, [stream]);

  useEffect(() => {
    if (peerConnections.current.size === 0) return;

    peerConnections.current.forEach((data) => {
      data.pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video') {
          sender.track.enabled = deviceEnable.video;
        } else if (sender.track?.kind === 'audio') {
          sender.track.enabled = deviceEnable.audio;
        }
      });
    });
  }, [deviceEnable]);

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
