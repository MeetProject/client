'use client';

import { useCallback, useRef, useState } from 'react';
import { ParticipantDataType, StreamType } from '@/type/signalType';
import { ChatResponseType, EmojiResponseType } from '@/type/reactionType';
import { useDeviceStore } from '@/store/DeviceStore';
import { useUserInfoStore } from '@/store/UserInfoStore';
import usePeerConnection from './usePeerConnection';
import useSignalSocket from './useSignalSocket';
import { useDevice2 } from '..';

interface UseWebRTCProps {
  onChat?: (data: ChatResponseType) => void;
  onEmoji?: (data: EmojiResponseType) => void;
}

const useWebRTC = ({ onChat, onEmoji }: UseWebRTCProps) => {
  const [isScreenShare, setIsScreenShare] = useState(false);
  const [participantsMediaStream, setParticipantsMediaStream] = useState<Map<string, MediaStream>>(new Map());
  const [screenSharingMediaStream, setScreenSharingMediaStream] = useState<MediaStream | null>(null);
  const participantsUserData = useRef<Map<string, ParticipantDataType>>(new Map());

  const { updateStream, stopStream, updateScreenStream, stopScreenStream } = useDevice2();

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
  } = usePeerConnection({ onTrack, onDisplayShareEnd });

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
    onChat,
    onEmoji,
  });

  const stopShareScreen = useCallback(() => {
    sendLeave('SCREEN');
    disconnectAllScreenPeerConnection();
    setScreenSharingMediaStream(null);
    stopScreenStream();
    setIsScreenShare(false);
  }, [sendLeave, disconnectAllScreenPeerConnection, stopScreenStream]);

  stopShareScreenRef.current = stopShareScreen;

  const joinSession = useCallback(async () => {
    const payload = {
      userName: 'name',
      userColor: 'color',
    };

    try {
      const response = await fetch('http://localhost:8080/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('api error');
      }

      const { userId } = await response.json();

      useUserInfoStore.getState().setId(userId);

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
    } catch {
      console.log('api error');
    }
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
      const { stream: mediaStream } = useDeviceStore.getState();
      if (!mediaStream) {
        await updateStream();
      }
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
