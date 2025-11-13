'use client';

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useRef } from 'react';
import {
  IcePayloadType,
  JoinResponseType,
  SdpPayloadType,
  RegisterResponseType,
  SdpResponseType,
  LeaveResponseType,
  ParticipantDataType,
  JoinPayloadType,
  LeavePayloadType,
  IceResponseType,
  StreamType,
  ScreenPayloadType,
  ScreenResponseType,
} from '@/type/signalType';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { useShallow } from 'zustand/react/shallow';

interface UseSignalSocketProps {
  onAddParticipantData: (userId: string, user: ParticipantDataType) => void;
  onDeleteParticipant: (targetId: string, streamType: StreamType) => void;
}

const useSignalSocket = ({ onAddParticipantData, onDeleteParticipant }: UseSignalSocketProps) => {
  const client = useRef<Client | null>(null);
  const subscriptions = useRef<Map<string, StompSubscription>>(new Map());

  const { name, color, setId } = useUserInfoStore(
    useShallow((state) => ({
      name: state.name,
      color: state.color,
      id: state.id,
      setId: state.setId,
    })),
  );

  const parseMessage = <T>(msg: IMessage) => {
    const data = JSON.parse(msg.body) as T;
    console.log(data);
    return data;
  };

  const getUserId = async (targetClient: Client): Promise<string> => {
    return new Promise((resolve) => {
      const subscribe = targetClient.subscribe('/user/queue/userId', (msg: IMessage) => {
        resolve(parseMessage<RegisterResponseType>(msg).userId);
        subscribe.unsubscribe();
      });

      targetClient.publish({
        destination: '/app/register',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userName: name,
          userColor: color,
        }),
      });
    });
  };

  const sendSdp = (
    destination: string,
    targetId: string,
    sdp: RTCSessionDescriptionInit,
    streamType: 'SCREEN' | 'USER',
  ) => {
    if (!client.current) {
      return;
    }

    const payload: SdpPayloadType = {
      toUserId: targetId,
      fromUserSDP: JSON.stringify(sdp),
      streamType,
    };

    client.current.publish({
      destination,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const offerIceCandidate = (targetId: string, candidate: RTCIceCandidate, streamType: StreamType) => {
    if (!client.current || !useUserInfoStore.getState().id) {
      return;
    }

    console.log('sending ice');

    const payload: IcePayloadType = {
      toUserId: targetId,
      fromCandidate: JSON.stringify(candidate),
      streamType,
    };

    client.current.publish({
      destination: '/app/signal/ice',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const connectSocket = (
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
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {},
      debug: (msg) => console.log(msg),
      onConnect: async () => {
        const userId = await getUserId(connectedClient);
        setId(userId);
        client.current = connectedClient;

        const joinSub = connectedClient.subscribe('/user/queue/signal/join', async (msg: IMessage) => {
          const { participants, screenId } = parseMessage<JoinResponseType>(msg);
          participants.forEach(async (participant) => {
            onAddParticipantData(participant.userId, participant);
            console.log('joining');
            await createPeerConnection(participant.userId, offerIceCandidate, 'USER', false);
            const sdp = await createOfferSdp(participant.userId, 'USER');
            await registerOfferSdp(participant.userId, sdp, 'USER');
            sendSdp('/app/signal/offer', participant.userId, sdp, 'USER');
          });

          if (screenId) {
            console.log('has screen');
            await createPeerConnection(screenId, offerIceCandidate, 'SCREEN', false);
            const sdp = await createOfferSdp(screenId, 'SCREEN');
            await registerOfferSdp(screenId, sdp, 'SCREEN');
            sendSdp('/app/signal/offer', screenId, sdp, 'SCREEN');
          }
        });
        subscriptions.current.set('join', joinSub);

        const offerSub = connectedClient.subscribe('/user/queue/signal/offer', async (msg: IMessage) => {
          const { fromUserId, fromUserSDP, streamType, isScreenSender } = parseMessage<SdpResponseType>(msg);
          const fromSDP = JSON.parse(fromUserSDP) as RTCSessionDescriptionInit;

          await createPeerConnection(fromUserId, offerIceCandidate, streamType, isScreenSender);
          await registerAnswerSdp(fromUserId, fromSDP, streamType);
          const sdp = await createAnswerSdp(fromUserId, streamType);
          await registerOfferSdp(fromUserId, sdp, streamType);
          sendSdp('/app/signal/answer', fromUserId, sdp, streamType);
        });
        subscriptions.current.set('offer', offerSub);

        const answerSub = connectedClient.subscribe('/user/queue/signal/answer', async (msg: IMessage) => {
          console.log(msg);
          const { fromUserId, fromUserSDP, streamType } = parseMessage<SdpResponseType>(msg);
          const sdp = JSON.parse(fromUserSDP) as RTCSessionDescriptionInit;
          await registerAnswerSdp(fromUserId, sdp, streamType);
        });
        subscriptions.current.set('answer', answerSub);

        const iceSub = connectedClient.subscribe('/user/queue/signal/ice', async (msg: IMessage) => {
          const { fromUserId, fromUserIce, streamType } = parseMessage<IceResponseType>(msg);
          const candidate = JSON.parse(fromUserIce) as RTCLocalIceCandidateInit;
          await registerRemoteIce(fromUserId, candidate, streamType);
        });
        subscriptions.current.set('ice', iceSub);

        const screenSub = connectedClient.subscribe('/user/queue/signal/screen', async (msg: IMessage) => {
          const { participants } = parseMessage<ScreenResponseType>(msg);
          participants.forEach(async (participant) => {
            await createPeerConnection(participant.userId, offerIceCandidate, 'SCREEN', true);
            const sdp = await createOfferSdp(participant.userId, 'SCREEN');
            await registerOfferSdp(participant.userId, sdp, 'SCREEN');
            sendSdp('/app/signal/offer', participant.userId, sdp, 'SCREEN');
          });
        });

        subscriptions.current.set('screen', screenSub);
      },
    });
    connectedClient.activate();
  };

  const sendJoin = (roomId: string) => {
    if (!client.current || !useUserInfoStore.getState().id) {
      return;
    }

    const payload: JoinPayloadType = {
      roomId,
    };

    client.current.publish({
      destination: '/app/signal/join',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const leaveSub = client.current.subscribe(`/topic/room/${roomId}/leave`, (msg: IMessage) => {
      const { fromUserId, streamType } = parseMessage<LeaveResponseType>(msg);
      onDeleteParticipant(fromUserId, streamType);
    });
    subscriptions.current.set(`leave-${roomId}`, leaveSub);
  };

  const shareScreen = (roomId: string) => {
    const userId = useUserInfoStore.getState().id;
    if (!client.current || !userId) {
      return;
    }

    const payload: ScreenPayloadType = {
      roomId,
    };

    client.current.publish({
      destination: '/app/signal/screen',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const stopScreenShare = (roomId: string) => {
    const userId = useUserInfoStore.getState().id;

    if (!client.current || !userId) {
      return;
    }

    const payload = {
      roomId,
      ownerId: userId,
    };

    client.current.publish({
      destination: '/app/signal/leave',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const sendLeave = (roomId: string, streamType: StreamType) => {
    if (!client.current || !useUserInfoStore.getState().id) {
      return;
    }

    const payload: LeavePayloadType = {
      roomId,
      streamType,
    };

    client.current.publish({
      destination: '/app/signal/leave',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    subscriptions.current.get(`leave-${roomId}`)?.unsubscribe();
    subscriptions.current.delete(`leave-${roomId}`);
  };

  const disconnectSocket = () => {
    if (!client.current) {
      return;
    }
    subscriptions.current.forEach((subscription) => subscription.unsubscribe());
    subscriptions.current.clear();
    client.current.deactivate();
    client.current = null;
  };

  return {
    connectSocket,
    sendJoin,
    sendLeave,
    shareScreen,
    stopScreenShare,
    disconnectSocket,
  };
};

export default useSignalSocket;
