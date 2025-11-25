'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getStreamConstraint } from '@/lib/getStreamConstraint';
import { useDeviceStore } from '@/store/DeviceStore';
import { getCurrentDeviceInfo } from '@/lib/getCurrentDeviceInfo';
import { useShallow } from 'zustand/react/shallow';
import { checkPermissionOnchange } from '@/lib/checkBrowser';
import useCheckPermission from './useCheckPermission';

const useDevice = () => {
  const { checkPermissionQuery, addPermissionListener } = useCheckPermission();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { deviceStream } = useDeviceStore(
    useShallow((state) => ({
      deviceStream: state.stream,
      enable: state.deviceEnable,
    })),
  );

  const stopStream = useCallback(() => {
    const { stream, setStreamStatus } = useDeviceStore.getState();
    if (!stream) {
      return;
    }

    setStreamStatus(null);

    stream.getTracks().forEach((device) => device.stop());
    useDeviceStore.getState().setStream(null);
  }, []);

  const stopScreenStream = useCallback(() => {
    const { screenStream, setScreenStream } = useDeviceStore.getState();
    if (!screenStream) {
      return screenStream;
    }
    screenStream.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
  }, []);

  const updateDeviceStatus = useCallback(async (mediaStream: MediaStream) => {
    const deviceInfo = await getCurrentDeviceInfo(mediaStream);

    useDeviceStore.getState().setAudioInputList(deviceInfo.currentAudioInputList);
    useDeviceStore.getState().setAudioOutputList(deviceInfo.currentAudioOutputList);
    useDeviceStore.getState().setVideoInputList(deviceInfo.currentVideoInputList);

    useDeviceStore.getState().setAudioInput(deviceInfo.currentAudioInput);
    if (!useDeviceStore.getState().audioOutput.id) {
      useDeviceStore.getState().setAudioOutput(deviceInfo.currentAudioOutput);
    }
    useDeviceStore.getState().setVideoInput(deviceInfo.currentVideoInput);

    return deviceInfo;
  }, []);

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      return false;
    }

    try {
      const videoPermission = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      });
      const audioPermission = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });

      if (audioPermission.state === 'prompt' || videoPermission.state === 'prompt') {
        return false;
      }

      const newPermission = {
        audio: Boolean(audioPermission.state === 'granted'),
        video: Boolean(videoPermission.state === 'granted'),
        isFailed: false,
      };
      useDeviceStore.getState().setPermission(newPermission);
      return newPermission;
    } catch {
      return false;
    }
  }, []);

  const getStream = useCallback(async (audio: boolean | string, video: boolean | string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: typeof audio === 'string' ? { deviceId: { exact: audio } } : audio,
        video: typeof video === 'string' ? { deviceId: { exact: video } } : video,
      });

      return stream;
    } catch (e) {
      const err = e as DOMException;
      if (err.name === 'NotAllowdError') {
        return false;
      }
      return 'failed';
    }
  }, []);

  const getUnsupprtedPermissionStream = useCallback(
    async (audio?: string, video?: string) => {
      const { setPermission } = useDeviceStore.getState();
      const ATVT = await getStream(audio ?? true, video ?? true);

      if (ATVT !== 'failed') {
        setPermission({ audio: true, video: true });
        return ATVT;
      }

      const ATVF = await getStream(audio ?? true, video ?? false);
      if (ATVF !== 'failed') {
        setPermission({ audio: true, video: false });
        return ATVF;
      }

      const AFVT = await getStream(audio ?? false, video ?? true);
      if (AFVT !== 'failed') {
        setPermission({ audio: false, video: true });
        return AFVT;
      }

      setPermission({ audio: false, video: false });
      return false;
    },
    [getStream],
  );

  const updateStream = useCallback(async () => {
    const { setStreamStatus, deviceEnable, audioInput, videoInput } = useDeviceStore.getState();
    stopStream();
    setStreamStatus('pending');

    const isPermissionUpdate = await checkPermission();
    try {
      const constraints = isPermissionUpdate
        ? getStreamConstraint(isPermissionUpdate, { audio: audioInput?.id, video: videoInput?.id })
        : undefined;
      const newStream = isPermissionUpdate
        ? await navigator.mediaDevices.getUserMedia(constraints)
        : await getUnsupprtedPermissionStream(audioInput?.id, videoInput?.id);

      if (!newStream) {
        throw new Error('권한 없음');
      }

      if (!deviceEnable.audio) {
        newStream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }

      if (!deviceEnable.video) {
        newStream.getVideoTracks().forEach((track) => {
          track.stop();
        });
      }

      updateDeviceStatus(newStream);
      useDeviceStore.getState().setStream(newStream);
      setStreamStatus('success');
      return newStream;
    } catch {
      setStreamStatus('rejected');
      useDeviceStore.getState().setStream(null);
      useDeviceStore.getState().setDeviceEnable({ audio: false, video: false });
      return null;
    }
  }, [stopStream, checkPermission, getUnsupprtedPermissionStream, updateDeviceStatus]);

  const updateScreenStream = useCallback(async (audio: boolean) => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ audio });
      useDeviceStore.getState().setScreenStream(mediaStream);
      return mediaStream;
    } catch {
      throw new Error('화면 공유 스트림 가져오기 실패');
    }
  }, []);

  const toggleAudioInput = useCallback(async () => {
    const { stream, deviceEnable } = useDeviceStore.getState();
    if (useDeviceStore.getState().stream && useDeviceStore.getState().audioInputList.length !== 0) {
      useDeviceStore.getState().setDeviceEnable(() => {
        const newValue = !deviceEnable.audio;
        stream.getAudioTracks().forEach((track) => {
          track.enabled = newValue;
        });
        return { ...deviceEnable, audio: newValue };
      });
    }
  }, []);

  const toggleVideoInput = useCallback(async () => {
    const { stream, deviceEnable } = useDeviceStore.getState();
    if (!stream) {
      return;
    }

    useDeviceStore.getState().setDeviceEnable((prev) => ({ ...prev, video: !prev.video }));
    if (deviceEnable.video) {
      stream.getVideoTracks().forEach((track) => {
        track.stop();
      });
    } else {
      updateStream();
    }
  }, [updateStream]);

  useEffect(() => {
    const handleDeviceChange = async () => {
      if (!deviceStream) {
        return;
      }
      await updateDeviceStatus(deviceStream);
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [deviceStream, updateDeviceStatus]);

  useEffect(() => {
    if (!deviceStream) {
      return;
    }
    const checkDevicePermission = async () => {
      const isEnableCheckPermission = await checkPermissionOnchange('microphone');
      if (isEnableCheckPermission) {
        await addPermissionListener(async () => {
          stopStream();
          await updateStream();
        });
      } else {
        timerRef.current = setInterval(async () => {
          const tracks = deviceStream.getTracks();
          const isDeny = tracks.some((track) => track.muted);
          if (isDeny) {
            stopStream();
            await updateStream();
          }
        }, 1000);
      }
    };

    checkDevicePermission();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [deviceStream, addPermissionListener, checkPermissionQuery, updateStream, stopStream]);

  useEffect(() => {
    if (!deviceStream) {
      return;
    }

    const checkLiveState = () => {
      const live = deviceStream.getTracks().some((track) => track.readyState === 'live');
      if (!live) {
        updateStream();
      }
    };

    deviceStream.getTracks().forEach((track) => {
      track.addEventListener('ended', checkLiveState);
    });

    checkLiveState();

    return () => {
      deviceStream.getTracks().forEach((track) => {
        track.removeEventListener('ended', checkLiveState);
      });
    };
  }, [deviceStream, updateStream]);

  return {
    updateStream,
    updateScreenStream,
    stopStream,
    stopScreenStream,
    toggleAudioInput,
    toggleVideoInput,
  };
};

export default useDevice;
