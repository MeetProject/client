'use client';

import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useCallback, useRef } from 'react';
import {
  IcePayloadType,
  JoinResponseType,
  SdpPayloadType,
  SdpResponseType,
  LeaveResponseType,
  ParticipantDataType,
  JoinPayloadType,
  LeavePayloadType,
  IceResponseType,
  StreamType,
  ScreenPayloadType,
  ScreenResponseType,
  ErrorResponseType,
} from '@/type/signalType';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { ChatResponseType, DeviceResponseType, EmojiResponseType } from '@/type/reactionType';
import { useClientStore } from '@/store/ClientStore';
import { useShallow } from 'zustand/react/shallow';
import { EmojiType } from '@/type/toggleType';
import { useDeviceStore } from '@/store/DeviceStore';
import { DeviceEnableType } from '@/type/streamType';

interface UseSignalSocketProps {
  onAddParticipantData: (userId: string, user: ParticipantDataType) => void;
  onDeleteParticipant: (targetId: string, streamType: StreamType) => void;
  onChat: (data: ChatResponseType) => void;
  onEmoji: (data: EmojiResponseType) => void;
  onDevice: (data: DeviceResponseType) => void;
}

const useSignalSocket = ({
  onAddParticipantData,
  onDeleteParticipant,
  onChat,
  onEmoji,
  onDevice,
}: UseSignalSocketProps) => {
  const { addRoomSubscriptions, addSubscriptions } = useClientStore(
    useShallow((state) => ({
      setClient: state.setClient,
      subscriptions: state.subscriptions,
      roomSubscriptions: state.roomSubscriptions,
      addSubscriptions: state.addSubscriptions,
      addRoomSubscriptions: state.addRoomSubscriptions,
    })),
  );
  const currentRoomId = useRef<string | null>(null);

  const parseMessage = <T>(msg: IMessage) => {
    const data = JSON.parse(msg.body) as T;
    return data;
  };

  const sendJoin = useCallback(
    (roomId: string) => {
      const { client } = useClientStore.getState();
      if (!useClientStore.getState().client || !useUserInfoStore.getState().id) {
        return;
      }

      const payload: JoinPayloadType = {
        roomId,
      };

      client.publish({
        destination: '/app/signal/join',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const leaveSub = client.subscribe(`/topic/room/${roomId}/leave`, (msg: IMessage) => {
        const { fromUserId, streamType } = parseMessage<LeaveResponseType>(msg);
        onDeleteParticipant(fromUserId, streamType);
      });
      addRoomSubscriptions('leave', leaveSub);

      const chatSub = client.subscribe(`/topic/room/${roomId}/chat`, (msg: IMessage) => {
        const response = parseMessage<ChatResponseType>(msg);
        onChat(response);
      });
      addRoomSubscriptions('chat', chatSub);

      const emojuSub = client.subscribe(`/topic/room/${roomId}/emoji`, (msg: IMessage) => {
        const response = parseMessage<EmojiResponseType>(msg);
        onEmoji(response);
      });
      addRoomSubscriptions('emoji', emojuSub);

      const deviceSub = client.subscribe(`/topic/room/${roomId}/device`, (msg: IMessage) => {
        const response = parseMessage<DeviceResponseType>(msg);
        onDevice(response);
      });
      addRoomSubscriptions('device', deviceSub);

      currentRoomId.current = roomId;
    },
    [addRoomSubscriptions, onChat, onDeleteParticipant, onEmoji, onDevice],
  );

  const sendSdp = useCallback(
    (destination: string, targetId: string, sdp: RTCSessionDescriptionInit, streamType: 'SCREEN' | 'USER') => {
      const { client } = useClientStore.getState();
      if (!client) {
        return;
      }

      const payload: SdpPayloadType = {
        toUserId: targetId,
        fromUserSDP: JSON.stringify(sdp),
        streamType,
        mediaOption: streamType === 'USER' ? useDeviceStore.getState().deviceEnable : null,
      };

      client.publish({
        destination,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },
    [],
  );

  const offerIceCandidate = useCallback((targetId: string, candidate: RTCIceCandidate, streamType: StreamType) => {
    const { client } = useClientStore.getState();
    if (!client || !useUserInfoStore.getState().id) {
      return;
    }

    console.log('sending ice');

    const payload: IcePayloadType = {
      toUserId: targetId,
      fromCandidate: JSON.stringify(candidate),
      streamType,
    };

    client.publish({
      destination: '/app/signal/ice',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }, []);

  const connectSocket = useCallback(
    (
      createPeerConnection: (
        targetId: string,
        onIceCandidate: (targetId: string, candidate: RTCIceCandidate, streamType: 'SCREEN' | 'USER') => void,
        streamType: 'SCREEN' | 'USER',
        isScreenSender?: boolean,
      ) => Promise<void>,
      createOfferSdp: (targetId: string, streamType: 'SCREEN' | 'USER') => Promise<RTCSessionDescriptionInit>,
      createAnswerSdp: (targetId: string, streamType: 'SCREEN' | 'USER') => Promise<RTCSessionDescriptionInit>,
      registerAnswerSdp: (
        targetId: string,
        targetSdp: RTCSessionDescriptionInit,
        streamType: 'SCREEN' | 'USER',
        mediaOption?: Record<'audio' | 'video', boolean>,
      ) => Promise<void>,
      registerOfferSdp: (
        targetId: string,
        targetSdp: RTCSessionDescriptionInit,
        streamType: 'SCREEN' | 'USER',
      ) => Promise<void>,
      registerRemoteIce: (
        targetId: string,
        targetIce: RTCLocalIceCandidateInit,
        streamType: 'SCREEN' | 'USER',
      ) => Promise<void>,
    ) => {
      const connectedClient = new Client({
        brokerURL: undefined,
        webSocketFactory: () => new SockJS(`http://localhost:8080/ws?userId=${useUserInfoStore.getState().id}`),
        debug: (msg) => console.log(msg),
        onConnect: async () => {
          useClientStore.getState().setIsClientReady(true);
          const joinSub = connectedClient.subscribe('/user/queue/signal/join', async (msg: IMessage) => {
            const { participants, screenId } = parseMessage<JoinResponseType>(msg);
            participants.forEach(async (participant) => {
              onAddParticipantData(participant.userId, participant);
              await createPeerConnection(participant.userId, offerIceCandidate, 'USER', false);
              const sdp = await createOfferSdp(participant.userId, 'USER');
              await registerOfferSdp(participant.userId, sdp, 'USER');
              sendSdp('/app/signal/offer', participant.userId, sdp, 'USER');
            });

            if (screenId) {
              await createPeerConnection(screenId, offerIceCandidate, 'SCREEN', false);
              const sdp = await createOfferSdp(screenId, 'SCREEN');
              await registerOfferSdp(screenId, sdp, 'SCREEN');
              sendSdp('/app/signal/offer', screenId, sdp, 'SCREEN');
            }
          });
          addSubscriptions('join', joinSub);

          const offerSub = connectedClient.subscribe('/user/queue/signal/offer', async (msg: IMessage) => {
            const { fromUserId, fromUserSDP, streamType, mediaOption, isScreenSender } =
              parseMessage<SdpResponseType>(msg);
            const fromSDP = JSON.parse(fromUserSDP) as RTCSessionDescriptionInit;

            await createPeerConnection(fromUserId, offerIceCandidate, streamType, isScreenSender);
            await registerAnswerSdp(fromUserId, fromSDP, streamType, mediaOption);
            const sdp = await createAnswerSdp(fromUserId, streamType);
            await registerOfferSdp(fromUserId, sdp, streamType);
            sendSdp('/app/signal/answer', fromUserId, sdp, streamType);
          });
          addSubscriptions('offer', offerSub);

          const answerSub = connectedClient.subscribe('/user/queue/signal/answer', async (msg: IMessage) => {
            const { fromUserId, fromUserSDP, streamType } = parseMessage<SdpResponseType>(msg);
            const sdp = JSON.parse(fromUserSDP) as RTCSessionDescriptionInit;
            await registerAnswerSdp(fromUserId, sdp, streamType);
          });
          addSubscriptions('answer', answerSub);

          const iceSub = connectedClient.subscribe('/user/queue/signal/ice', async (msg: IMessage) => {
            const { fromUserId, fromUserIce, streamType } = parseMessage<IceResponseType>(msg);
            const candidate = JSON.parse(fromUserIce) as RTCLocalIceCandidateInit;
            await registerRemoteIce(fromUserId, candidate, streamType);
          });
          addSubscriptions('ice', iceSub);

          const screenSub = connectedClient.subscribe('/user/queue/signal/screen', async (msg: IMessage) => {
            const { participants } = parseMessage<ScreenResponseType>(msg);
            participants.forEach(async (participant) => {
              await createPeerConnection(participant, offerIceCandidate, 'SCREEN', true);
              const sdp = await createOfferSdp(participant, 'SCREEN');
              await registerOfferSdp(participant, sdp, 'SCREEN');
              sendSdp('/app/signal/offer', participant, sdp, 'SCREEN');
            });
          });
          addSubscriptions('screen', screenSub);

          const errorSub = connectedClient.subscribe('/user/queue/signal/error', async (msg: IMessage) => {
            const { code, message } = parseMessage<ErrorResponseType>(msg);
            console.log(code, message);
            alert(message);
          });
          addSubscriptions('error', errorSub);

          useClientStore.getState().setClient(connectedClient);
          console.log(connectedClient);

          if (currentRoomId.current) {
            sendJoin(currentRoomId.current);
          }
        },
      });
      connectedClient.activate();
    },
    [onAddParticipantData, addSubscriptions, offerIceCandidate, sendJoin, sendSdp],
  );

  const shareScreen = useCallback(() => {
    const { client } = useClientStore.getState();
    const userId = useUserInfoStore.getState().id;
    if (!client || !userId || !currentRoomId.current) {
      return;
    }

    const payload: ScreenPayloadType = {
      roomId: currentRoomId.current,
    };

    client.publish({
      destination: '/app/signal/screen',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }, []);

  const stopScreenShare = useCallback(() => {
    const { client } = useClientStore.getState();
    const userId = useUserInfoStore.getState().id;

    if (!client || !userId || !currentRoomId.current) {
      return;
    }

    const payload = {
      roomId: currentRoomId.current,
      ownerId: userId,
    };

    client.publish({
      destination: '/app/signal/leave',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }, []);

  const sendChat = useCallback((message: string) => {
    const { client } = useClientStore.getState();
    const { id: userId } = useUserInfoStore.getState();

    if (!client || !userId || !currentRoomId.current) {
      return;
    }

    const payload = {
      roomId: currentRoomId.current,
      message,
      userId,
    };

    client.publish({
      destination: '/app/chat/send',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }, []);

  const sendEmoji = useCallback((emoji: EmojiType) => {
    const { client } = useClientStore.getState();
    const { id: userId } = useUserInfoStore.getState();

    if (!client || !userId || !currentRoomId.current) {
      return;
    }

    const payload = {
      roomId: currentRoomId.current,
      emoji: emoji.toUpperCase(),
      userId,
    };

    client.publish({
      destination: '/app/emoji',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }, []);

  const sendDevice = useCallback((mediaOption: DeviceEnableType) => {
    const { client } = useClientStore.getState();
    const { id: userId } = useUserInfoStore.getState();

    if (!client || !userId || !currentRoomId.current) {
      return;
    }
    console.log('send', mediaOption);
    const payload = {
      roomId: currentRoomId.current,
      userId,
      mediaOption,
    };

    client.publish({
      destination: '/app/device',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }, []);

  const sendLeave = useCallback((streamType: StreamType) => {
    const { client, clearRoomSubscriptions } = useClientStore.getState();
    if (!client || !useUserInfoStore.getState().id || !currentRoomId.current) {
      return;
    }

    const payload: LeavePayloadType = {
      roomId: currentRoomId.current,
      streamType,
    };

    client.publish({
      destination: '/app/signal/leave',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (streamType === 'USER') {
      clearRoomSubscriptions();
      currentRoomId.current = null;
    }
  }, []);

  const disconnectSocket = useCallback(() => {
    const { client, clearSubscriptions, setClient, setIsClientReady } = useClientStore.getState();
    if (!client) {
      return;
    }
    clearSubscriptions();
    client.deactivate();
    setClient(null);
    setIsClientReady(null);
  }, []);

  /* useEffect(() => {
    const handler = () => {
      const userId = useUserInfoStore.getState().id;
      const roomId = currentRoomId.current;
      if (!userId || !roomId) return;

      const data = new FormData();
      data.append('userId', userId);
      data.append('roomId', roomId);

      navigator.sendBeacon('http://localhost:8080/api/leave', data);
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []); */

  return {
    connectSocket,
    sendJoin,
    sendLeave,
    sendChat,
    sendEmoji,
    sendDevice,
    shareScreen,
    stopScreenShare,
    disconnectSocket,
  };
};

export default useSignalSocket;
