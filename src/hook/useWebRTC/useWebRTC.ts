'use client';

import { useCallback, useRef, useState } from 'react';
import { ParticipantDataType, StreamType } from '@/type/signalType';
import usePeerConnection from './usePeerConnection';
import useSignalSocket from './useSignalSocket';
import { useDevice2 } from '..';

const useWebRTC = () => {
  const [isScreenShare, setIsScreenShare] = useState(false);
  const [participantsMediaStream, setParticipantsMediaStream] = useState<Map<string, MediaStream>>(new Map());
  const [screenSharingMediaStream, setScreenSharingMediaStream] = useState<MediaStream | null>(null);
  const participantsUserData = useRef<Map<string, ParticipantDataType>>(new Map());

  const { streamRef, screenStreamRef, updateStream, stopStream, updateScreenStream, stopScreenStream } = useDevice2();

  const stopShareScreenRef = useRef<() => void>();

  const handleAddParticipantUserData = (userId: string, user: ParticipantDataType) => {
    participantsUserData.current.set(userId, user);
  };

  const onTrack = useCallback(
    async (targetId: string, targetStream: MediaStream, streamType: StreamType, isScreenSender: boolean) => {
      if (streamType === 'USER') {
        setParticipantsMediaStream((prev) => {
          const map = new Map(prev);
          map.set(targetId, targetStream);
          return map;
        });
      }
      if (streamType === 'SCREEN' && !isScreenSender) {
        setScreenSharingMediaStream(targetStream);
      }
    },
    [],
  );

  const onDisplayShareEnd = useCallback(() => {
    stopShareScreenRef.current?.();
  }, []);

  const {
    createPeerConnection,
    createOfferSdp,
    createAnswerSdp,
    registerAnswerSdp,
    registerOfferSdp,
    registerRemoteIce,
    disconnectPeerConnection,
    disconnectAllPeerConnection,
    disconnectAllScreenPeerConnection,
  } = usePeerConnection({ streamRef, screenStreamRef, onTrack, onDisplayShareEnd });

  const deleteParticipant = useCallback(
    (targetId: string, streamType: StreamType) => {
      disconnectPeerConnection(targetId, streamType);
      if (streamType === 'USER') {
        participantsUserData.current.delete(targetId);
        setParticipantsMediaStream((prev) => {
          const newMap = new Map(prev);
          newMap.delete(targetId);
          return newMap;
        });
        return;
      }

      setScreenSharingMediaStream(null);
    },
    [disconnectPeerConnection],
  );

  const {
    connectSocket,
    sendJoin,
    sendLeave,
    disconnectSocket,
    shareScreen: sharingScreen,
  } = useSignalSocket({
    onAddParticipantData: handleAddParticipantUserData,
    onDeleteParticipant: deleteParticipant,
  });

  const stopShareScreen = useCallback(() => {
    sendLeave('SCREEN');
    disconnectAllScreenPeerConnection();
    setScreenSharingMediaStream(null);
    stopScreenStream();
    setIsScreenShare(false);
  }, [sendLeave, disconnectAllScreenPeerConnection, stopScreenStream]);

  stopShareScreenRef.current = stopShareScreen;

  const joinSession = useCallback(() => {
    connectSocket(
      (
        targetId: string,
        onIceCandidate: (targetId: string, candidate: RTCIceCandidate, streamType: StreamType) => void,
        streamType: 'SCREEN' | 'USER',
        isScreenSender = false,
      ) => createPeerConnection(targetId, onIceCandidate, streamType, isScreenSender),
      createOfferSdp,
      createAnswerSdp,
      registerAnswerSdp,
      registerOfferSdp,
      registerRemoteIce,
    );
  }, [
    connectSocket,
    createPeerConnection,
    createOfferSdp,
    createAnswerSdp,
    registerAnswerSdp,
    registerOfferSdp,
    registerRemoteIce,
  ]);

  const joinRoom = useCallback(
    async (targetRoomId: string) => {
      await updateStream();
      sendJoin(targetRoomId);
    },
    [sendJoin, updateStream],
  );

  const shareScreen = useCallback(async () => {
    if (screenSharingMediaStream) return;
    await updateScreenStream(true);
    sharingScreen();
    setIsScreenShare(true);
  }, [screenSharingMediaStream, sharingScreen, updateScreenStream]);

  const clearPeerConnection = useCallback(() => {
    disconnectAllPeerConnection();
    disconnectAllScreenPeerConnection();
    participantsUserData.current.clear();
    setParticipantsMediaStream(new Map());
    setScreenSharingMediaStream(null);
  }, [disconnectAllPeerConnection, disconnectAllScreenPeerConnection]);

  const createRoom = useCallback(async () => {
    const response = await fetch('http://localhost:8080/api/room/create', { method: 'POST' });
    if (!response.ok) {
      console.log(response);
      throw new Error('api Error');
    }

    const { roomId: id } = (await response.json()) as { roomId: string };
    await joinRoom(id);
  }, [joinRoom]);

  const leaveRoom = useCallback(() => {
    if (isScreenShare) {
      stopShareScreen();
    }
    sendLeave('USER');

    clearPeerConnection();
    stopStream();
  }, [sendLeave, clearPeerConnection, stopStream, isScreenShare, stopShareScreen]);

  const leaveSession = useCallback(() => {
    leaveRoom();
    disconnectSocket();
  }, [leaveRoom, disconnectSocket]);

  return {
    joinSession,
    joinRoom,
    leaveRoom,
    createRoom,
    leaveSession,
    shareScreen,
    stopShareScreen,
    participantsMediaStream,
    screenSharingMediaStream,
    participantsUserData,
  };
};

export default useWebRTC;
