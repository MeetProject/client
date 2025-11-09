'use client';

import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useRef } from 'react';

const useSignalSocket = () => {
  const client = useRef<Client | null>(null);
  const id = useRef<string | null>(null);

  const connect = () => {
    console.log('소켓 연결 시도');

    const connectedClient = new Client({
      brokerURL: undefined,
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {},
      onConnect: () => {
        connectedClient.subscribe('/user/queue/userId', (msg) => {
          const { userId } = JSON.parse(msg.body);
          id.current = userId;
        });

        connectedClient.subscribe('/queue/signal/join', (msg: IMessage) => {
          const message = JSON.parse(msg.body);
          console.log(message);
        });

        connectedClient.publish({ destination: '/app/register' });
        client.current = connectedClient;
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
