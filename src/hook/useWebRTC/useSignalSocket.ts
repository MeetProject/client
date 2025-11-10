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

const useSignalSocket = () => {
  const client = useRef<Client | null>(null);
  const id = useRef<string | null>(null);

  const participantsData = useRef<Map<string, ParticipantsSignalType>>(new Map());

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

      targetClient.publish({ destination: '/app/register' });
    });
  };

  const sendSdp = (destination: string, targetId: string, sdp: RTCSessionDescriptionInit) => {
    if (!client.current || !id.current) {
      return;
    }

    const payload: SdpPayloadType = {
      fromUserId: id.current,
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
    if (!client.current || !id.current) {
      return;
    }

    const payload: IcePayloadType = {
      fromUserId: id.current,
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
  ) => {
    const connectedClient = new Client({
      brokerURL: undefined,
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {},
      debug: (msg) => console.log(msg),
      onConnect: async () => {
        id.current = await getUserId(connectedClient);
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
          /* 받은 ice 등록 */
        });
      },
    });
    connectedClient.activate();
  };

  const sendJoin = (roomId: string) => {
    if (!client.current || !id.current) {
      return;
    }

    client.current.publish({
      destination: '/app/signal/join',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: id.current,
        roomId,
      }),
    });
  };

  return {
    connectSocket,
    sendJoin,
    offerSDP,
  };
};

export default useSignalSocket;
