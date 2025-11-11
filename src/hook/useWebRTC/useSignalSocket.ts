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
} from '@/type/signalType';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { useShallow } from 'zustand/react/shallow';

interface UseSignalSocketProps {
  onAddParticipantData: (userId: string, user: ParticipantDataType) => void;
  onDeleteParticipant: (targetId: string) => void;
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

  const sendSdp = (destination: string, targetId: string, sdp: RTCSessionDescriptionInit) => {
    if (!client.current || !useUserInfoStore.getState().id) {
      return;
    }

    console.log('sending sdp');

    const payload: SdpPayloadType = {
      fromUserId: useUserInfoStore.getState().id,
      toUserId: targetId,
      fromUserSDP: JSON.stringify(sdp),
    };

    client.current.publish({
      destination,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const offerIceCandidate = (targetId: string, candidate: RTCIceCandidate) => {
    if (!client.current || !useUserInfoStore.getState().id) {
      return;
    }

    console.log('sending ice');

    const payload: IcePayloadType = {
      fromUserId: useUserInfoStore.getState().id,
      toUserId: targetId,
      fromCandidate: JSON.stringify(candidate),
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
      onIceCandidate: (targetId: string, candidate: RTCIceCandidate) => void,
    ) => void,
    createOfferSdp: (targetId: string) => Promise<RTCSessionDescriptionInit>,
    createAnswerSdp: (targetId: string) => Promise<RTCSessionDescriptionInit>,
    registerAnswerSdp: (targetId: string, targetSdp: RTCSessionDescriptionInit) => Promise<void>,
    registerOfferSdp: (targetId: string, targetSdp: RTCSessionDescriptionInit) => Promise<void>,
    registerRemoteIce: (targetId: string, targetIce: RTCLocalIceCandidateInit) => Promise<void>,
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

        const joinSub = connectedClient.subscribe('/user/queue/signal/join', (msg: IMessage) => {
          const { participants } = parseMessage<JoinResponseType>(msg);

          participants.forEach(async (participant) => {
            onAddParticipantData(participant.userId, participant);
            createPeerConnection(participant.userId, offerIceCandidate);
            const sdp = await createOfferSdp(participant.userId);
            await registerOfferSdp(participant.userId, sdp);
            sendSdp('/app/signal/offer', participant.userId, sdp);
          });
        });
        subscriptions.current.set('join', joinSub);

        const offerSub = connectedClient.subscribe('/user/queue/signal/offer', async (msg: IMessage) => {
          const { fromUserId, fromUserSDP } = parseMessage<SdpResponseType>(msg);
          const fromSDP = JSON.parse(fromUserSDP) as RTCSessionDescriptionInit;
          createPeerConnection(fromUserId, offerIceCandidate);
          await registerAnswerSdp(fromUserId, fromSDP);
          const sdp = await createAnswerSdp(fromUserId);
          await registerOfferSdp(fromUserId, sdp);
          sendSdp('/app/signal/answer', fromUserId, sdp);
        });
        subscriptions.current.set('offer', offerSub);

        const answerSub = connectedClient.subscribe('/user/queue/signal/answer', async (msg: IMessage) => {
          const { fromUserId, fromUserSDP } = parseMessage<SdpResponseType>(msg);
          const sdp = JSON.parse(fromUserSDP) as RTCSessionDescription;
          await registerAnswerSdp(fromUserId, sdp);
        });
        subscriptions.current.set('answer', answerSub);

        const iceSub = connectedClient.subscribe('/user/queue/signal/ice', async (msg: IMessage) => {
          const { fromUserId, fromCandidate } = parseMessage<IcePayloadType>(msg);
          const candidate = JSON.parse(fromCandidate) as RTCLocalIceCandidateInit;
          await registerRemoteIce(fromUserId, candidate);
        });
        subscriptions.current.set('ice', iceSub);
      },
    });
    connectedClient.activate();
  };

  const sendJoin = (roomId: string) => {
    if (!client.current || !useUserInfoStore.getState().id) {
      return;
    }

    client.current.publish({
      destination: '/app/signal/join',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: useUserInfoStore.getState().id,
        roomId,
      }),
    });

    const leaveSub = client.current.subscribe(`/topic/room/${roomId}/leave`, (msg: IMessage) => {
      const { fromUserId } = parseMessage<LeaveResponseType>(msg);
      onDeleteParticipant(fromUserId);
    });
    subscriptions.current.set(`leave-${roomId}`, leaveSub);
  };

  const sendLeave = (roomId: string) => {
    if (!client.current || !useUserInfoStore.getState().id) {
      return;
    }

    client.current.publish({
      destination: '/app/signal/leave',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: useUserInfoStore.getState().id,
        roomId,
      }),
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
    disconnectSocket,
  };
};

export default useSignalSocket;
