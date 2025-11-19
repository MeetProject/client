'use client';

import { useCallback, useRef, useEffect } from 'react';
import { ErrorResponseType, StreamType } from '@/type/signalType';
import { ChatResponseType, EmojiResponseType } from '@/type/reactionType';
import { DeviceEnableType } from '@/type/streamType';
import { useClientStore } from '@/store/ClientStore';
import { useWebRTCStore } from '@/store/WebRTCStore';
import usePeerConnection from './usePeerConnection';
import useSignalSocket from './useSignalSocket';
import { useDevice2 } from '..';

interface UseWebRTCProps {
  onChat?: (data: ChatResponseType) => void;
  onEmoji?: (data: EmojiResponseType) => void;
  onError?: (data: ErrorResponseType) => void;
}

const useWebRTC = ({ onChat, onEmoji, onError }: UseWebRTCProps) => {
  const onTrackRef =
    useRef<(targetId: string, targetStream: MediaStream, streamType: StreamType, isScreenSender: boolean) => void>();
  const onDeviceEnableChangeRef = useRef<(id: string, value: DeviceEnableType) => void>();

  const onTrack = useCallback(
    (targetId: string, targetStream: MediaStream, streamType: StreamType, isScreenSender: boolean) => {
      const { updateParticipantsMediaStream, setScreenSharingMediaStream, setScreenOwnerId } =
        useWebRTCStore.getState();

      if (streamType === 'USER') {
        updateParticipantsMediaStream(targetId, targetStream);
      }

      if (streamType === 'SCREEN' && !isScreenSender) {
        setScreenSharingMediaStream(targetStream);
        setScreenOwnerId(targetId);
      }
    },
    [],
  );

  const onDeviceEnableChange = useCallback((id: string, value: DeviceEnableType) => {
    const { updateParticipantsMediaOptions } = useWebRTCStore.getState();
    updateParticipantsMediaOptions(id, value);
  }, []);

  useEffect(() => {
    onTrackRef.current = onTrack;
  }, [onTrack]);

  useEffect(() => {
    onDeviceEnableChangeRef.current = onDeviceEnableChange;
  }, [onDeviceEnableChange]);

  const { updateStream, stopStream, updateScreenStream, stopScreenStream } = useDevice2();

  const stopShareScreenRef = useRef<() => void>();

  const onDisplayShareEnd = useCallback(() => {
    const { setScreenOwnerId } = useWebRTCStore.getState();
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
  } = usePeerConnection({
    onTrack: (id, stream, type, isScreenSender) => onTrackRef.current?.(id, stream, type, isScreenSender),
    onDisplayShareEnd,
    onDeviceEnableChange: (id, value) => onDeviceEnableChangeRef.current?.(id, value),
  });

  const deleteParticipant = useCallback(
    (targetId: string, streamType: StreamType) => {
      const {
        setScreenSharingMediaStream,
        setScreenOwnerId,
        deleteParticipantsMediaStream,
        deleteParticipantsUserData,
      } = useWebRTCStore.getState();
      disconnectPeerConnection(targetId, streamType);

      if (streamType === 'USER') {
        deleteParticipantsUserData(targetId);
        deleteParticipantsMediaStream(targetId);
        return;
      }

      setScreenSharingMediaStream(null);
      setScreenOwnerId(null);
    },
    [disconnectPeerConnection],
  );

  const {
    connectSocket,
    sendJoin,
    sendLeave,
    sendChat,
    sendEmoji,
    sendHandUp,
    sendDevice,
    disconnectSocket,
    shareScreen: sharingScreen,
  } = useSignalSocket({
    onDeleteParticipant: deleteParticipant,
    onChat,
    onEmoji,
    onError,
  });

  const stopShareScreen = useCallback(() => {
    const { setScreenSharingMediaStream, setIsScreenShare } = useWebRTCStore.getState();
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
      (targetId, onIceCandidate, streamType, isScreenSender = false) =>
        createPeerConnection(targetId, onIceCandidate, streamType, isScreenSender),
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
    const { screenSharingMediaStream, setIsScreenShare } = useWebRTCStore.getState();
    if (screenSharingMediaStream) return;
    await updateScreenStream(true);
    sharingScreen();
    setIsScreenShare(true);
  }, [sharingScreen, updateScreenStream]);

  const clearPeerConnection = useCallback(() => {
    const { setParticipantsUserData, setParticipantsMediaStream, setScreenSharingMediaStream } =
      useWebRTCStore.getState();
    disconnectAllPeerConnection();
    disconnectAllScreenPeerConnection();
    setParticipantsUserData(new Map());
    setParticipantsMediaStream(new Map());
    setScreenSharingMediaStream(null);
  }, [disconnectAllPeerConnection, disconnectAllScreenPeerConnection]);

  const leaveRoom = useCallback(() => {
    const { isScreenShare } = useWebRTCStore.getState();
    if (isScreenShare) {
      stopShareScreen();
    }
    sendLeave('USER');
    clearPeerConnection();
    stopStream();
  }, [sendLeave, clearPeerConnection, stopStream, stopShareScreen]);

  const leaveSession = useCallback(() => {
    leaveRoom();
    disconnectSocket();
  }, [leaveRoom, disconnectSocket]);

  return {
    joinSession,
    joinRoom,
    sendChat,
    sendEmoji,
    sendHandUp,
    sendDevice,
    leaveRoom,
    leaveSession,
    shareScreen,
    stopShareScreen,
  };
};

export default useWebRTC;
