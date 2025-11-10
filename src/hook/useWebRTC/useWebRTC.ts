'use client';

import { useRef } from 'react';
import usePeerConnection from './usePeerConnection';
import useSignalSocket from './useSignalSocket';

const useWebRTC = () => {
  const { createPeerConnection, getSdp, registerRemoteSdp, registerRemoteIce } = usePeerConnection();
  const { connectSocket, sendJoin } = useSignalSocket();

  const participantsMediaStream = useRef<Map<string, MediaStream>>(new Map());

  const onTrack = (targetId: string, stream: MediaStream) => {
    participantsMediaStream.current.set(targetId, stream);
  };

  const joinSession = (roomId: string) => {
    connectSocket(
      (targetId: string, onIceCandidate: (targetId: string, candidate: RTCIceCandidate) => void) =>
        createPeerConnection(targetId, onIceCandidate, onTrack),
      getSdp,
      registerRemoteSdp,
      registerRemoteIce,
    );
    sendJoin(roomId);
  };

  return { joinSession };
};

export default useWebRTC;
