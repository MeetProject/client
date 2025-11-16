import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  OpenVidu,
  Session as OVSession,
  Publisher,
  SignalEvent,
  StreamEvent,
  StreamPropertyChangedEvent,
  Subscriber,
} from 'openvidu-browser';
import { postToken } from '@/app/api/sessionAPI';
import { deleteSessionId, deleteParticipant, postParticipant } from '@/app/api/mongoAPI';
import { useDeviceStore } from '@/store/DeviceStore';
import { useRouter } from 'next/navigation';
import { getDevicePermission } from '@/lib/getDevicePermission';
import { ChatInfo, EmojiInfo, UserInfo } from '@/type/sessionType';
import { getBase60 } from '@/lib/getRandomId';
import { timeDifferenceInMinutes } from '@/lib/getTimeDiff';
import { useUserInfoStore } from '@/store/UserInfoStore';
import { EmojiType } from '@/type/toggleType';
import useDevice from './useDevice';

const UNPUBLISH = new Set(['unpublish', 'forceUnpublishByUser', 'forceUnpublishByServer']);

const useOpenvidu = (sessionId: string) => {
  const router = useRouter();

  const isOnlyRef = useRef<boolean | null>(null);
  const [isInitial, setIsInitial] = useState(true);

  const isStreamUpdate = useRef<boolean>(true);

  const [session, setSession] = useState<OVSession | null>(null);
  const [publisher, setPublisher] = useState<Publisher | null | undefined>(undefined);
  const [subscribers, setSubscribers] = useState<[string, Subscriber | null][]>([]);
  const [participants, setParticipants] = useState<Record<string, UserInfo>>({});
  const [OV, setOV] = useState<OpenVidu | null>(null);
  const [chatList, setChatList] = useState<ChatInfo[]>([]);
  const [screenSession, setScreenSession] = useState<OVSession | null>(null);
  const [screenPublisher, setScreenPublisher] = useState<[string, Publisher | Subscriber] | null>(null);
  const [isMyScreenShare, setIsMyScreenShare] = useState<boolean>(false);
  const [emojiList, setEmojiList] = useState<EmojiInfo[]>([]);
  const [handsUpList, setHandsUpList] = useState<Record<string, boolean>>({});
  const [isRaiseHand, setIsRaiseHand] = useState<boolean>(false);

  const { id, name, color, setId } = useUserInfoStore(
    useShallow((state) => ({
      id: state.id,
      name: state.name,
      color: state.color,
      setId: state.setId,
      setName: state.setName,
      setColor: state.setColor,
    })),
  );

  const { permission, audioInput, videoInput, setDeviceEnable, setPermission } = useDeviceStore(
    useShallow((state) => ({
      audioInput: state.audioInput,
      videoInput: state.videoInput,
      permission: state.permission,
      setDeviceEnable: state.setDeviceEnable,
      setPermission: state.setPermission,
    })),
  );

  const { stream, streamStatus, handleUpdateStream } = useDevice();

  const leaveSession = useCallback(async () => {
    if (session) {
      if (publisher === null) {
        session.signal({
          type: 'leave',
          data: JSON.stringify({ userId: session.connection.connectionId }),
        });
        session.disconnect();
      }

      session.connection.stream
        ?.getMediaStream()
        ?.getTracks()
        .forEach((track) => track.stop());
      await session.disconnect();
    }

    if (screenSession) {
      screenSession.connection.stream
        ?.getMediaStream()
        .getTracks()
        .forEach((track) => track.stop());
      screenSession.disconnect();
    }

    if (publisher?.stream.getMediaStream()) {
      const mediaStream = publisher.stream.getMediaStream();
      mediaStream.getTracks().forEach((track) => track.stop());
    }

    if (screenPublisher && screenPublisher[1].stream.getMediaStream()) {
      screenPublisher[1].stream
        .getMediaStream()
        .getTracks()
        .forEach((track) => track.stop());
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    setOV(null);
    setSession(null);
    setParticipants({});
    setPublisher(null);
    setSubscribers([]);
    setScreenSession(null);
    await deleteParticipant(sessionId, id);
  }, [session, publisher, stream, screenSession, screenPublisher, sessionId, id]);

  const publishVideo = useCallback(
    async (newOV: OpenVidu, newSession: OVSession) => {
      const publishConstraint = {
        audioSource: permission && permission.audio ? (audioInput?.id ? audioInput.id : true) : false,
        videoSource: permission && permission.video ? (videoInput?.id ? videoInput.id : true) : false,
      };

      const newPublisher = newOV.initPublisher(undefined, publishConstraint);
      await newSession.publish(newPublisher);
      setPublisher(newPublisher);
    },
    [permission, audioInput, videoInput],
  );

  const joinSession = useCallback(async () => {
    try {
      const token = await postToken(sessionId, name, color);
      const newOV = new OpenVidu();
      newOV.enableProdMode();
      setOV(newOV);
      const newSession = newOV.initSession();
      await newSession.connect(token, { clientData: { name, color } });
      const {
        connection: { connectionId },
      } = newSession;
      setId(connectionId);
      setSession(newSession);

      setSubscribers(() => {
        const data: [string, Subscriber | null][] = [];
        newSession.remoteConnections.forEach((entry) => {
          if (entry.stream && entry.stream.typeOfVideo === 'SCREEN') {
            return;
          }
          data.push([entry.connectionId, entry.stream ? newSession.subscribe(entry.stream, undefined) : null]);
        });
        return data;
      });

      newSession.remoteConnections.forEach((entry) => {
        if (entry.stream && entry.stream.typeOfVideo === 'SCREEN') {
          setScreenPublisher([entry.connectionId, newSession.subscribe(entry.stream, undefined)]);
        }
      });

      setParticipants(() => {
        const totalParticipants = {};
        newSession.remoteConnections.forEach((entry) => {
          const { data } = entry;
          Object.assign(totalParticipants, {
            [entry.connectionId]: {
              name: JSON.parse(data).clientData.name,
              color: JSON.parse(data).clientData.color,
              audio: entry.stream?.audioActive,
              video: entry.stream?.videoActive,
            },
          });
        });
        return totalParticipants;
      });

      if (stream) {
        await publishVideo(newOV, newSession);
      } else {
        setPublisher(null);
        await newSession.signal({
          type: 'participate',
          data: JSON.stringify({
            userName: name,
            color,
            userId: newSession.connection.connectionId,
          }),
        });
      }

      await postParticipant(sessionId, connectionId, name, color);
    } catch {
      alert('이미 닫힌 회의실입니다');
      leaveSession();
      router.push('/landing');
    }
  }, [name, sessionId, color, router, leaveSession, setId, publishVideo, stream]);

  const changeDevice = useCallback(
    async (type: 'audio' | 'video', value: boolean | string) => {
      if (!publisher || !session) {
        return;
      }

      if (typeof value === 'boolean') {
        setDeviceEnable((prev) => ({ ...prev, [type === 'audio' ? 'audio' : 'video']: value }));
        if (type === 'audio') {
          await publisher.publishAudio(value);
          return;
        }
        await publisher.publishVideo(value);
        return;
      }

      const newPermission = await getDevicePermission();
      setPermission(newPermission);
      setDeviceEnable((prev) => ({
        audio: prev.audio && newPermission.audio,
        video: prev.video && newPermission.video,
      }));

      if (type === 'audio') {
        if (!newPermission.audio) {
          return;
        }
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: value } });
        const track = newStream.getAudioTracks()[0];
        await publisher.replaceTrack(track);
        return newStream;
      }
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: value } });
      const track = newStream.getVideoTracks()[0];
      await publisher.replaceTrack(track);
      return newStream;
    },
    [publisher, session, setPermission, setDeviceEnable],
  );

  const sendMessage = useCallback(
    (message: string) => {
      if (!session) {
        return;
      }
      session.signal({
        type: 'chat',
        data: JSON.stringify({
          id: `${id}-${getBase60(new Date().getTime())}`,
          userName: name,
          userId: id,
          date: new Date(),
          content: message,
        }),
      });
    },
    [session, name, id],
  );

  const stopShareScreen = useCallback(async () => {
    if (!screenSession) {
      return;
    }
    screenSession.disconnect();
    setScreenSession(null);
    setScreenPublisher(null);
  }, [screenSession]);

  const shareScreen = useCallback(async () => {
    const token = await postToken(sessionId, name, color);
    const newOV = new OpenVidu();

    if (!token) {
      return;
    }

    const newSession = newOV.initSession();
    await newSession.connect(token, { clientData: { name, color } });

    setScreenSession(newSession);

    const newScreenPublisher = newOV.initPublisher(undefined, {
      videoSource: 'screen',
      audioSource: 'screen',
    });

    setIsMyScreenShare(true);

    newScreenPublisher.once('accessAllowed', async () => {
      const mediaStream = newScreenPublisher.stream.getMediaStream();
      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        newSession.disconnect();
      });
      newSession.publish(newScreenPublisher);
    });

    newScreenPublisher.once('accessDenied', stopShareScreen);
  }, [color, name, sessionId, stopShareScreen]);

  const sendHandsUp = useCallback(
    (value: boolean) => {
      if (!session) {
        return;
      }

      setIsRaiseHand(value);
      session.signal({
        type: 'handsUp',
        data: JSON.stringify({
          userId: id,
          value,
        }),
      });
    },
    [id, session],
  );

  const sendEmoji = useCallback(
    (emojiType: EmojiType) => {
      if (!session) {
        return;
      }
      session.signal({
        type: 'emoji',
        data: JSON.stringify({
          id: `${id}-${getBase60(new Date().getTime())}-emoji`,
          userName: name,
          userId: id,
          emojiType,
        }),
      });
    },
    [id, name, session],
  );

  const deleteEmoji = useCallback((emojiId: string) => {
    setEmojiList((prev) => prev.filter((emoji) => emoji.id !== emojiId));
  }, []);

  useEffect(() => {
    const cleanUpSession = () => {
      const payload = JSON.stringify({ sessionId, userId: id });
      navigator.sendBeacon(`/api/participant/delete`, payload);
      leaveSession();
    };
    window.addEventListener('beforeunload', cleanUpSession);
    return () => {
      window.removeEventListener('beforeunload', cleanUpSession);
    };
  }, [leaveSession, id, sessionId]);

  useEffect(() => {
    const initialJoinSession = async () => {
      if (stream === undefined || !isInitial) {
        return;
      }
      setIsInitial(false);
      await joinSession();
    };

    initialJoinSession();
  }, [joinSession, isInitial, permission, stream]);

  useEffect(() => {
    isStreamUpdate.current = true;
  }, [stream]);

  useEffect(() => {
    const updateTrack = async () => {
      if (!publisher || !stream || !session || !OV) {
        return;
      }

      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      await session.unpublish(publisher);
      const newPublisher = OV.initPublisher(undefined, {
        audioSource: !!audioTrack,
        videoSource: !!videoTrack,
        publishAudio: !!audioTrack,
        publishVideo: !!videoTrack,
      });
      await session.publish(newPublisher);
      setPublisher(newPublisher);
    };
    if (isStreamUpdate.current) {
      isStreamUpdate.current = false;
      updateTrack();
    }
  }, [session, publisher, stream, OV]);

  useEffect(() => {
    isOnlyRef.current = subscribers.length === 0;
  }, [subscribers]);

  useEffect(() => {
    return () => {
      const deleteSession = async () => {
        if (session && isOnlyRef.current) {
          await deleteSessionId(sessionId);
        }
      };
      deleteSession();
    };
  }, [session, sessionId]);

  useEffect(() => {
    if (!session) {
      return;
    }
    const handleCreateStream = (e: StreamEvent) => {
      const { connectionId, data } = e.stream.connection;

      if (!session || connectionId === id) {
        return;
      }

      if (isRaiseHand) {
        session.signal({
          type: 'raiseHandUpdate',
          data: JSON.stringify({ id }),
          to: [e.stream.connection],
        });
      }

      if (e.stream.typeOfVideo === 'SCREEN') {
        if (!screenPublisher) {
          setScreenPublisher([connectionId, session.subscribe(e.stream, undefined)]);
          setParticipants((prev) => ({
            ...prev,
            [connectionId]: {
              name: JSON.parse(data).clientData.name,
              color: JSON.parse(data).clientData.color,
              audio: e.stream.audioActive,
              video: e.stream.videoActive,
            },
          }));
        }
        return;
      }
      setParticipants((prev) => ({
        ...prev,
        [connectionId]: {
          name: JSON.parse(data).clientData.name,
          color: JSON.parse(data).clientData.color,
          audio: e.stream.audioActive,
          video: e.stream.videoActive,
        },
      }));
      const newSubscribe = session.subscribe(e.stream, undefined);
      setSubscribers((prev) => [
        ...prev.filter((subscriber) => subscriber[0] !== connectionId),
        [connectionId, newSubscribe],
      ]);
    };

    const handleDestroyStream = (e: StreamEvent) => {
      const { connectionId } = e.stream.connection;
      const isDisconnected = !UNPUBLISH.has(e.reason);

      if (connectionId === id || !isDisconnected) {
        return;
      }

      if (e.stream.typeOfVideo === 'SCREEN') {
        setScreenPublisher(null);
        setIsMyScreenShare(false);
        setParticipants((prev) => {
          const newParticipants = { ...prev };
          delete newParticipants[connectionId];
          return newParticipants;
        });
        return;
      }

      setParticipants((prev) => {
        const newParticipants = { ...prev };
        delete newParticipants[connectionId];
        return newParticipants;
      });
      setSubscribers((prev) => prev.filter((subscriber) => subscriber[0] !== connectionId));
    };

    const handleStreamPropertyChanged = (event: StreamPropertyChangedEvent) => {
      const { changedProperty, newValue } = event;
      const { connectionId } = event.stream.connection;

      if (connectionId === id) {
        return;
      }

      if (changedProperty === 'audioActive') {
        setParticipants((prev) => ({
          ...prev,
          [connectionId]: {
            ...prev[connectionId],
            audio: newValue as boolean,
          },
        }));
      }
      if (changedProperty === 'videoActive') {
        setParticipants((prev) => ({
          ...prev,
          [connectionId]: {
            ...prev[connectionId],
            video: newValue as boolean,
          },
        }));
      }
    };

    const handleMessageRecive = (e: SignalEvent) => {
      if (e.data) {
        const newChat = JSON.parse(e.data) as ChatInfo;
        if (!newChat) {
          return;
        }

        setChatList((prev) => {
          if (prev.length === 0) {
            return [{ ...newChat, header: true }];
          }
          const lastChat = prev[prev.length - 1];
          if (timeDifferenceInMinutes(lastChat.date, newChat.date) > 2 || newChat.userId !== lastChat.userId) {
            return [...prev, { ...newChat, header: true }];
          }
          return [...prev, { ...newChat, header: false }];
        });
      }
    };

    const handleEmojiRecive = (e: SignalEvent) => {
      const { data } = e;
      if (!data) {
        return;
      }
      const newEmoji = JSON.parse(data) as Omit<EmojiInfo, 'date'>;
      setEmojiList((prev) => [...prev, { ...newEmoji, date: new Date() }]);
    };

    const handleHandsUpRecive = (e: SignalEvent) => {
      const { data } = e;
      if (!data) {
        return;
      }
      const handsUpStatus = JSON.parse(data) as { userId: string; value: boolean };

      setHandsUpList((prev) => {
        if (handsUpStatus.value) {
          return { ...prev, [handsUpStatus.userId]: handsUpStatus.value };
        }
        const prevData = { ...prev };
        delete prevData[handsUpStatus.userId];
        return prevData;
      });
    };

    const handleHandsUpUpdateRecive = (e: SignalEvent) => {
      const { data } = e;
      if (!data) {
        return;
      }

      const updateData = JSON.parse(data) as { id: string };
      setHandsUpList((prev) => ({ ...prev, [updateData.id]: true }));
    };

    const handleParticipate = (e: SignalEvent) => {
      const { data } = e;
      if (!data) {
        return;
      }

      const responseData = JSON.parse(data) as { userName: string; color: string; userId: string };
      const { userId, userName, color: userColor } = responseData;

      if (userId === id) {
        return;
      }

      if (isRaiseHand) {
        session.signal({
          type: 'raiseHandUpdate',
          data: JSON.stringify({ id }),
        });
      }

      setParticipants((prev) => ({
        ...prev,
        [userId]: { name: userName, color: userColor, audio: false, video: false },
      }));
      setSubscribers((prev) => [...prev.filter((subscriber) => subscriber[0] !== userId), [userId, null]]);
    };

    const handleLeave = (e: SignalEvent) => {
      const { data } = e;
      if (!data) {
        return;
      }

      const { userId } = JSON.parse(data) as { userId: string };

      setSubscribers((prev) => prev.filter((subscriber) => subscriber[0] !== userId));
      setParticipants((prev) => {
        const newParticipants = { ...prev };
        delete newParticipants[userId];
        return newParticipants;
      });
    };

    session.on('streamCreated', handleCreateStream);
    session.on('streamDestroyed', handleDestroyStream);
    session.on('streamPropertyChanged', handleStreamPropertyChanged);
    session.on('signal:chat', handleMessageRecive);
    session.on('signal:emoji', handleEmojiRecive);
    session.on('signal:handsUp', handleHandsUpRecive);
    session.on('signal:raiseHandUpdate', handleHandsUpUpdateRecive);
    session.on('signal:participate', handleParticipate);
    session.on('signal:leave', handleLeave);

    return () => {
      session.off('streamCreated', handleCreateStream);
      session.off('streamDestroyed', handleDestroyStream);
      session.off('streamPropertyChanged', handleStreamPropertyChanged);
      session.off('signal:chat', handleMessageRecive);
      session.off('signal:emoji', handleEmojiRecive);
      session.off('signal:handsUp', handleHandsUpRecive);
      session.off('signal:raiseHandUpdate', handleHandsUpUpdateRecive);
      session.off('signal:participate', handleParticipate);
      session.off('signal:leave', handleLeave);
    };
  }, [session, id, screenPublisher, isRaiseHand, color, name, publisher]);

  return {
    publisher,
    subscribers,
    session,
    participants,
    OV,
    stream,
    chatList,
    screenPublisher,
    isMyScreenShare,
    emojiList,
    handsUpList,
    streamStatus,
    leaveSession,
    changeDevice,
    handleUpdateStream,
    sendMessage,
    shareScreen,
    stopShareScreen,
    sendEmoji,
    deleteEmoji,
    sendHandsUp,
  };
};

export default useOpenvidu;
