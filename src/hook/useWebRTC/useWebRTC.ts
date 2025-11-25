'use client';

import { useCallback, useRef, useEffect } from 'react';

import { useClientStore } from '@/store/ClientStore';
import { useWebRTCStore } from '@/store/WebRTCStore';
import { ChatResponseType, EmojiResponseType } from '@/type/reactionType';
import { ErrorResponseType, StreamType } from '@/type/signalType';
import { DeviceEnableType } from '@/type/streamType';

import { useDevice2 } from '..';
import usePeerConnection from './usePeerConnection';
import useSignalSocket from './useSignalSocket';

interface UseWebRTCProperties {
  onChat?: (data: ChatResponseType) => void;
  onEmoji?: (data: EmojiResponseType) => void;
  onError?: (data: ErrorResponseType) => void;
}

const useWebRTC = ({ onChat, onEmoji, onError }: UseWebRTCProperties) => {
  const onTrackReference =
    useRef<(targetId: string, targetStream: MediaStream, streamType: StreamType, isScreenSender: boolean) => void>();
  const onDeviceEnableChangeReference = useRef<(id: string, value: DeviceEnableType) => void>();

  const onTrack = useCallback(
    (targetId: string, targetStream: MediaStream, streamType: StreamType, isScreenSender: boolean) => {
      const { setScreenOwnerId, setScreenSharingMediaStream, updateParticipantsMediaStream } =
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
    onTrackReference.current = onTrack;
  }, [onTrack]);

  useEffect(() => {
    onDeviceEnableChangeReference.current = onDeviceEnableChange;
  }, [onDeviceEnableChange]);

  const { stopScreenStream, stopStream, updateScreenStream, updateStream } = useDevice2();

  const stopShareScreenReference = useRef<() => void>();

  const onDisplayShareEnd = useCallback(() => {
    const { setScreenOwnerId } = useWebRTCStore.getState();
    stopShareScreenReference.current?.();
    setScreenOwnerId(null);
  }, []);

  const {
    createAnswerSdp,
    createOfferSdp,
    createPeerConnection,
    disconnectAllPeerConnection,
    disconnectAllScreenPeerConnection,
    disconnectPeerConnection,
    registerAnswerSdp,
    registerOfferSdp,
    registerRemoteIce,
  } = usePeerConnection({
    onDeviceEnableChange: (id, value) => onDeviceEnableChangeReference.current?.(id, value),
    onDisplayShareEnd,
    onTrack: (id, stream, type, isScreenSender) => onTrackReference.current?.(id, stream, type, isScreenSender),
  });

  const deleteParticipant = useCallback(
    (targetId: string, streamType: StreamType) => {
      const {
        deleteParticipantsMediaStream,
        deleteParticipantsUserData,
        setScreenOwnerId,
        setScreenSharingMediaStream,
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
    disconnectSocket,
    sendChat,
    sendDevice,
    sendEmoji,
    sendHandUp,
    sendJoin,
    sendLeave,
    shareScreen: sharingScreen,
  } = useSignalSocket({
    onChat,
    onDeleteParticipant: deleteParticipant,
    onEmoji,
    onError,
  });

  const stopShareScreen = useCallback(() => {
    const { setIsScreenShare, setScreenSharingMediaStream } = useWebRTCStore.getState();
    sendLeave('SCREEN');
    disconnectAllScreenPeerConnection();
    setScreenSharingMediaStream(null);
    stopScreenStream();
    setIsScreenShare(false);
  }, [sendLeave, disconnectAllScreenPeerConnection, stopScreenStream]);

  stopShareScreenReference.current = stopShareScreen;

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
    const { setParticipantsMediaStream, setParticipantsUserData, setScreenSharingMediaStream } =
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
    joinRoom,
    joinSession,
    leaveRoom,
    leaveSession,
    sendChat,
    sendDevice,
    sendEmoji,
    sendHandUp,
    shareScreen,
    stopShareScreen,
  };
};

export default useWebRTC;
