'use client';

import { useRef } from 'react';
import { ParticipantDataType } from '@/type/signalType';
import usePeerConnection from './usePeerConnection';
import useSignalSocket from './useSignalSocket';

const useWebRTC = () => {
  const participantsMediaStream = useRef<Map<string, MediaStream>>(new Map());
  const participantsUserData = useRef<Map<string, ParticipantDataType>>(new Map());
  const roomId = useRef<string | null>(null);

  const { createPeerConnection, getSdp, registerRemoteSdp, registerRemoteIce, disconnectPeerConection } =
    usePeerConnection();

  const handleAddParticipantUserData = (userId: string, user: ParticipantDataType) => {
    participantsUserData.current.set(userId, user);
  };

  const deleteParticipant = (targetId: string) => {
    disconnectPeerConection(targetId);
    participantsUserData.current.delete(targetId);
    participantsMediaStream.current.delete(targetId);
  };

  const { connectSocket, sendJoin, sendLeave } = useSignalSocket({
    onAddParticipantData: handleAddParticipantUserData,
    onDeleteParticipant: deleteParticipant,
  });

  const onTrack = (targetId: string, stream: MediaStream) => {
    participantsMediaStream.current.set(targetId, stream);
  };

  const joinSession = () => {
    connectSocket(
      (targetId: string, onIceCandidate: (targetId: string, candidate: RTCIceCandidate) => void) =>
        createPeerConnection(targetId, onIceCandidate, onTrack),
      getSdp,
      registerRemoteSdp,
      registerRemoteIce,
    );
  };

  const joinRoom = (targetRoomId: string) => {
    roomId.current = targetRoomId;
    sendJoin(targetRoomId);
  };

  const leaveRoom = () => {
    if (!roomId.current) {
      return;
    }

    sendLeave(roomId.current);
    disconnectPeerConection();

    participantsUserData.current.clear();
    participantsMediaStream.current.clear();
    roomId.current = null;
  };

  return { joinSession, joinRoom, leaveRoom };
};

export default useWebRTC;
