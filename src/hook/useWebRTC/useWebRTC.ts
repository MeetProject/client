'use client';

import { useCallback, useRef, useState } from 'react';
import { ParticipantDataType, StreamType } from '@/type/signalType';
import { ChatResponseType, DeviceResponseType, EmojiResponseType } from '@/type/reactionType';
import { DeviceEnableType } from '@/type/streamType';
import { useClientStore } from '@/store/ClientStore';
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
  const [participantsUserData, setParticipantsUserData] = useState<Map<string, ParticipantDataType>>(new Map());
  const [screenOwnerId, setScreenOwnerId] = useState<string | null>(null);
  const [participantsMediaOptions, setParticipantsMediaOptions] = useState<Map<string, DeviceEnableType>>(new Map());

  const onDeviceEnableChange = useCallback((id: string, value: DeviceEnableType) => {
    setParticipantsMediaOptions((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, value);
      return newMap;
    });
  }, []);

  const handleDevice = useCallback((data: DeviceResponseType) => {
    setParticipantsMediaOptions((prev) => {
      const { userId, mediaOption } = data;
      const newMap = new Map(prev);
      newMap.set(userId, mediaOption);
      return new Map(newMap);
    });
  }, []);

  const { updateStream, stopStream, updateScreenStream, stopScreenStream } = useDevice2();

  const stopShareScreenRef = useRef<() => void>();

  const handleAddParticipantUserData = (userId: string, user: ParticipantDataType) => {
    setParticipantsUserData((prev) => {
      const newMap = new Map(prev);
      newMap.set(userId, user);
      return newMap;
    });
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
        setScreenOwnerId(targetId);
      }
    },
    [setParticipantsMediaStream, setScreenSharingMediaStream, setScreenOwnerId],
  );

  const onDisplayShareEnd = useCallback(() => {
    stopShareScreenRef.current?.();
    setScreenOwnerId(null);
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
  } = usePeerConnection({ onTrack, onDisplayShareEnd, onDeviceEnableChange });

  const deleteParticipant = useCallback(
    (targetId: string, streamType: StreamType) => {
      disconnectPeerConnection(targetId, streamType);
      if (streamType === 'USER') {
        setParticipantsUserData((prev) => {
          const newMap = new Map(prev);
          newMap.delete(targetId);
          return newMap;
        });
        setParticipantsMediaStream((prev) => {
          const newMap = new Map(prev);
          newMap.delete(targetId);
          return newMap;
        });
        return;
      }

      setScreenSharingMediaStream(null);
      setScreenOwnerId(null);
    },
    [setParticipantsUserData, setParticipantsMediaStream, disconnectPeerConnection],
  );

  const {
    connectSocket,
    sendJoin,
    sendLeave,
    sendChat,
    sendEmoji,
    sendDevice,
    disconnectSocket,
    shareScreen: sharingScreen,
  } = useSignalSocket({
    onAddParticipantData: handleAddParticipantUserData,
    onDeleteParticipant: deleteParticipant,
    onChat,
    onEmoji,
    onDevice: handleDevice,
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
    useClientStore.getState().setIsClientReady(false);
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

      if (useClientStore.getState().isClientReady === null) {
        await joinSession();
      }

      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (useClientStore.getState().isClientReady) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
      sendJoin(targetRoomId);
    },
    [sendJoin, updateStream, joinSession],
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
    setParticipantsUserData(new Map());
    setParticipantsMediaStream(new Map());
    setScreenSharingMediaStream(null);
  }, [disconnectAllPeerConnection, disconnectAllScreenPeerConnection]);

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
    sendChat,
    sendEmoji,
    sendDevice,
    leaveRoom,
    leaveSession,
    shareScreen,
    stopShareScreen,
    participantsMediaStream,
    screenSharingMediaStream,
    participantsUserData,
    screenOwnerId,
    participantsMediaOptions,
  };
};

export default useWebRTC;
