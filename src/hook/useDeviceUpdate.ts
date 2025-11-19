'use client';

import { useCallback, useEffect } from 'react';
import { getStreamConstraint } from '@/lib/getStreamConstraint';
import { useDeviceStore } from '@/store/DeviceStore';
import { getCurrentDeviceInfo } from '@/lib/getCurrentDeviceInfo';
import { useShallow } from 'zustand/react/shallow';
import { checkPermissionOnchange } from '@/lib/checkBrowser';
import useCheckPermission from './useCheckPermission';

const useDevice = () => {
  const { updatePermission, checkPermissionQuery, addPermissionListener } = useCheckPermission();

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

  const updateDeviceEnable = useCallback(() => {
    const { permission, deviceEnable } = useDeviceStore.getState();
    const audioDeviceId = (permission.audio && useDeviceStore.getState().audioInputList?.[0]?.deviceId) || undefined;
    const videoDeviceId = (permission.video && useDeviceStore.getState().videoInputList?.[0]?.deviceId) || undefined;

    useDeviceStore.getState().setDeviceEnable({
      audio: deviceEnable.audio && !!audioDeviceId,
      video: deviceEnable.video && !!videoDeviceId,
    });
  }, []);

  const updateStream = useCallback(async () => {
    const { setStreamStatus, deviceEnable, audioInput, videoInput } = useDeviceStore.getState();
    stopStream();
    setStreamStatus('pending');
    const permission = await updatePermission();

    try {
      const con = getStreamConstraint(permission, deviceEnable, { audio: audioInput?.id, video: videoInput?.id });
      const newStream = await navigator.mediaDevices.getUserMedia(con);
      await updateDeviceStatus(newStream);
      updateDeviceEnable();

      if (!deviceEnable.audio) {
        newStream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }

      useDeviceStore.getState().setStream(newStream);
      setStreamStatus('success');
      return newStream;
    } catch {
      setStreamStatus('rejected');
      useDeviceStore.getState().setStream(null);
      useDeviceStore.getState().setDeviceEnable({ audio: false, video: false });
      return null;
    }
  }, [updateDeviceStatus, updatePermission, stopStream, updateDeviceEnable]);

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
      }
    };

    checkDevicePermission();
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
