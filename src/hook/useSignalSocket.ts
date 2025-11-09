'use client';

import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useRef } from 'react';
import { JoinResponseType, ParticipantsSignalType, RegisterResponseType } from '@/type/signalType';

const useSignalSocket = () => {
  const client = useRef<Client | null>(null);
  const id = useRef<string | null>(null);

  const participants = useRef<ParticipantsSignalType[] | null>(null);

  const parseMessage = <T>(msg: IMessage) => {
    return JSON.parse(msg.body) as T;
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
          participants.current = parseMessage<JoinResponseType>(msg);
          console.log(participants.current);
        });
      },
    });
    connectedClient.activate();
  };

  const sendJoin = async (roomId: string) => {
    if (!client.current || !id.current) {
      return null;
    }

    participants.current = null;

    client.current!.publish({
      destination: '/app/signal/join',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        userId: id.current,
        roomId,
      }),
    });
  };

  return {
    connect,
    sendJoin,
  };
};

export default useSignalSocket;
