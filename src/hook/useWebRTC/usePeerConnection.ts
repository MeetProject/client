'use client';

import { useRef } from 'react';
import useDevice from '../useDevice';

const usePeerConnection = () => {
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  const { stream } = useDevice();

  const createPeerConnection = (
    targetId: string,
    onIceCandidate: (targetId: string, candidate: RTCIceCandidate) => void,
    onTrack: (targetId: string, stream: MediaStream) => void,
  ) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(targetId, event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      onTrack(targetId, remoteStream);
    };

    if (stream) {
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
    }

    peerConnections.current.set(targetId, peerConnection);
  };

  const getSdp = async (targetId: string): Promise<RTCSessionDescriptionInit> => {
    const peerConnection = peerConnections.current.get(targetId);

    if (!peerConnection) {
      throw new Error('해당 id의 peerConnection이 없음');
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    return offer;
  };

  const registerRemoteSdp = async (targetId: string, targetSdp: RTCSessionDescription) => {
    const peerConnection = peerConnections.current.get(targetId);
    if (!peerConnection) {
      throw new Error('해당 id의 peerConnection이 없음');
    }

    await peerConnection.setRemoteDescription(targetSdp);
  };

  const registerRemoteIce = async (targetId: string, targetIce: RTCLocalIceCandidateInit) => {
    const peerConnection = peerConnections.current.get(targetId);

    if (!peerConnection) {
      throw new Error('해당 id의 peerConnection이 없음');
    }

    await peerConnection.addIceCandidate(new RTCIceCandidate(targetIce));
  };

  return { createPeerConnection, getSdp, registerRemoteSdp, registerRemoteIce };
};

export default usePeerConnection;
