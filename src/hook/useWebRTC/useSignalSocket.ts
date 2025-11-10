'use client';

import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useRef } from 'react';
import { JoinResponseType, OfferPayloadType, ParticipantsSignalType, RegisterResponseType } from '@/type/signalType';

interface UseSignalProps {
  getSdp: (targetId: string) => Promise<RTCSessionDescriptionInit>;
}

const useSignalSocket = ({ getSdp }: UseSignalProps) => {
  const client = useRef<Client | null>(null);
  const id = useRef<string | null>(null);

  const participants = useRef<ParticipantsSignalType[] | null>(null);

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

  const connect = () => {
    const connectedClient = new Client({
      brokerURL: undefined,
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {},
      debug: (msg) => console.log(msg),
      onConnect: async () => {
        id.current = await getUserId(connectedClient);
        client.current = connectedClient;

        connectedClient.subscribe('/user/queue/signal/join', (msg: IMessage) => {
          participants.current = parseMessage<JoinResponseType>(msg).participants;
          console.log(participants.current);
        });

        connectedClient.subscribe('/user/queue/signal/offer', async (msg: IMessage) => {
          /* answer에 대한 publish 추가 */
          /* get sdp */
        });
      },
    });
    connectedClient.activate();
  };

  const sendJoin = (roomId: string) => {
    if (!client.current || !id.current) {
      return;
    }

    participants.current = null;

    client.current.publish({
      destination: '/app/signal/join',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: id.current,
        roomId,
      }),
    });
  };

  const offerSDP = (targetId: string, sdp: string) => {
    if (!client.current || !id.current || !targetId) {
      return;
    }

    const payload: OfferPayloadType = {
      fromUserId: id.current,
      toUserId: id.current /* 상대 id로 변경 예정 */,
      fromUserSDP: sdp,
    };

    client.current.publish({
      destination: '/app/signal/offer',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  return {
    connect,
    sendJoin,
    offerSDP,
  };
};

export default useSignalSocket;
