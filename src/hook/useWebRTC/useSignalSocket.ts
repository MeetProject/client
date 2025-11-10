'use client';

import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useRef } from 'react';
import {
  IcePayloadType,
  JoinResponseType,
  SdpPayloadType,
  RegisterResponseType,
  ParticipantsSignalType,
  SdpResponseType,
} from '@/type/signalType';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { useShallow } from 'zustand/react/shallow';

const useSignalSocket = () => {
  const client = useRef<Client | null>(null);
  const currentRoomId = useRef<string | null>(null);

  const participantsData = useRef<Map<string, ParticipantsSignalType>>(new Map());

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
    getSdp: (targetId: string) => Promise<RTCSessionDescriptionInit>,
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

        connectedClient.subscribe('/user/queue/signal/join', (msg: IMessage) => {
          const { participants } = parseMessage<JoinResponseType>(msg);

          participants.forEach(async (participant) => {
            participantsData.current.set(participant.userId, participant);
            createPeerConnection(participant.userId, offerIceCandidate);
            const sdp = await getSdp(participant.userId);
            sendSdp('/app/signal/offer', participant.userId, sdp);
          });
        });

        connectedClient.subscribe('/user/queue/signal/offer', async (msg: IMessage) => {
          const { fromUserId, fromUserSdp } = parseMessage<SdpResponseType>(msg);
          createPeerConnection(fromUserId, offerIceCandidate);
          await registerRemoteSdp(fromUserId, fromUserSdp);
          const sdp = await getSdp(fromUserId);
          sendSdp('/app/signal/answer', fromUserId, sdp);
        });

        connectedClient.subscribe('/user/queue/signal/answer', async (msg: IMessage) => {
          const { fromUserId, fromUserSdp } = parseMessage<SdpResponseType>(msg);
          await registerRemoteSdp(fromUserId, fromUserSdp);
        });

        connectedClient.subscribe('/user/queue/signal/ice', async (msg: IMessage) => {
          const { fromUserId, fromCandidate } = parseMessage<IcePayloadType>(msg);
          await registerRemoteIce(fromUserId, fromCandidate);
        });
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
    currentRoomId.current = roomId;
  };

  return {
    connectSocket,
    sendJoin,
  };
};

export default useSignalSocket;
