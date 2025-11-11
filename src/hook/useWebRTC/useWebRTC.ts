'use client';

import { useCallback, useRef, useState } from 'react';
import { ParticipantDataType } from '@/type/signalType';
import usePeerConnection from './usePeerConnection';
import useSignalSocket from './useSignalSocket';

const useWebRTC = () => {
  const [participantsMediaStream, setParticipantsMediaStream] = useState<Map<string, MediaStream>>(new Map());
  const participantsUserData = useRef<Map<string, ParticipantDataType>>(new Map());
  const roomId = useRef<string | null>(null);

  const onTrack = useCallback((targetId: string, stream: MediaStream) => {
    setParticipantsMediaStream((prev) => {
      const map = new Map(prev);
      map.set(targetId, stream);
      return map;
    });
  }, []);

  const {
    createPeerConnection,
    createOfferSdp,
    createAnswerSdp,
    registerAnswerSdp,
    registerOfferSdp,
    registerRemoteIce,
    disconnectPeerConection,
    disconnectAllPeerConnection,
  } = usePeerConnection({ onTrack });

  const handleAddParticipantUserData = (userId: string, user: ParticipantDataType) => {
    participantsUserData.current.set(userId, user);
  };

  const deleteParticipant = (targetId: string) => {
    disconnectPeerConection(targetId);
    participantsUserData.current.delete(targetId);
    setParticipantsMediaStream((prev) => {
      const map = new Map(prev);
      prev.delete(targetId);
      return map;
    });
  };

  const { connectSocket, sendJoin, sendLeave, disconnectSocket } = useSignalSocket({
    onAddParticipantData: handleAddParticipantUserData,
    onDeleteParticipant: deleteParticipant,
  });

  const joinSession = () => {
    connectSocket(
      (targetId: string, onIceCandidate: (targetId: string, candidate: RTCIceCandidate) => void) =>
        createPeerConnection(targetId, onIceCandidate),
      createOfferSdp,
      createAnswerSdp,
      registerAnswerSdp,
      registerOfferSdp,
      registerRemoteIce,
    );
  };

  const joinRoom = (targetRoomId: string) => {
    roomId.current = targetRoomId;
    sendJoin(targetRoomId);
  };

  const clearSession = () => {
    disconnectAllPeerConnection();
    participantsUserData.current.clear();
    setParticipantsMediaStream(new Map());
    roomId.current = null;
  };

  const createRoom = async () => {
    const response = await fetch('http://localhost:8080/api/room/create', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('api error');
    }

    const { roomId: id } = (await response.json()) as { roomId: string };
    console.log(id);

    joinRoom(id);
  };

  const leaveRoom = () => {
    if (!roomId.current) {
      return;
    }

    sendLeave(roomId.current);
    clearSession();
  };

  const leaveSession = () => {
    if (roomId.current) {
      leaveRoom();
    }
    disconnectSocket();
  };

  return { joinSession, joinRoom, leaveRoom, createRoom, leaveSession, participantsMediaStream, participantsUserData };
};

export default useWebRTC;
