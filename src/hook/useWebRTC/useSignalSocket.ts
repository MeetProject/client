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

  const { name, color, id, setId } = useUserInfoStore(
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
    if (!client.current || !id) {
      return;
    }

    const payload: SdpPayloadType = {
      fromUserId: id,
      toUserId: targetId,
      fromUserSdp: sdp,
    };

    client.current.publish({
      destination,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const offerIceCandidate = (targetId: string, candidate: RTCIceCandidate) => {
    if (!client.current || !id) {
      return;
    }

    const payload: IcePayloadType = {
      fromUserId: id,
      toUserId: targetId,
      fromCandidate: candidate,
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
    registerRemoteSdp: (targetId: string, targetSdp: RTCSessionDescription) => Promise<void>,
    registerRemoteIce: (targetId: string, targetIce: RTCLocalIceCandidateInit) => Promise<void>,
  ) => {
    const connectedClient = new Client({
      brokerURL: undefined,
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {},
      debug: (msg) => console.log(msg),
      onConnect: async () => {
        setId(await getUserId(connectedClient));
        client.current = connectedClient;

        const joinSub = connectedClient.subscribe('/user/queue/signal/join', (msg: IMessage) => {
          const { participants } = parseMessage<JoinResponseType>(msg);

          participants.forEach(async (participant) => {
            onAddParticipantData(participant.userId, participant);
            createPeerConnection(participant.userId, offerIceCandidate);
            const sdp = await createOfferSdp(participant.userId);
            sendSdp('/app/signal/offer', participant.userId, sdp);
          });
        });
        subscriptions.current.set('join', joinSub);

        const offerSub = connectedClient.subscribe('/user/queue/signal/offer', async (msg: IMessage) => {
          const { fromUserId, fromUserSdp } = parseMessage<SdpResponseType>(msg);
          createPeerConnection(fromUserId, offerIceCandidate);
          await registerRemoteSdp(fromUserId, fromUserSdp);
          const sdp = await createOfferSdp(fromUserId);
          sendSdp('/app/signal/answer', fromUserId, sdp);
        });
        subscriptions.current.set('offer', offerSub);

        const answerSub = connectedClient.subscribe('/user/queue/signal/answer', async (msg: IMessage) => {
          const { fromUserId, fromUserSdp } = parseMessage<SdpResponseType>(msg);
          await registerRemoteSdp(fromUserId, fromUserSdp);
        });
        subscriptions.current.set('answer', answerSub);

        const iceSub = connectedClient.subscribe('/user/queue/signal/ice', async (msg: IMessage) => {
          const { fromUserId, fromCandidate } = parseMessage<IcePayloadType>(msg);
          await registerRemoteIce(fromUserId, fromCandidate);
        });
        subscriptions.current.set('ice', iceSub);
      },
    });
    connectedClient.activate();
  };

  const sendJoin = (roomId: string) => {
    if (!client.current || !id) {
      return;
    }

    client.current.publish({
      destination: '/app/signal/join',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: id,
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
    if (!client.current || !id) {
      return;
    }

    client.current.publish({
      destination: '/app/signal/leave',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: id,
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
