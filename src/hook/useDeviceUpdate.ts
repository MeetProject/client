'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { getStreamConstraint } from '@/lib/getStreamConstraint';
import { useDeviceStore } from '@/store/DeviceStore';
import { StreamStatusType } from '@/type/streamType';
import { getCurrentDeviceInfo } from '@/lib/getCurrentDeviceInfo';
import { useShallow } from 'zustand/react/shallow';
import useCheckPermission from './useCheckPermission';

const useDevice = () => {
  const { updatePermission, checkPermissionQuery, addPermissionListener } = useCheckPermission();

  const [streamStatus, setStreamStatus] = useState<StreamStatusType>(null);

  const { deviceStream, enable } = useDeviceStore(
    useShallow((state) => ({
      deviceStream: state.stream,
      enable: state.deviceEnable,
    })),
  );

  const timerRef = useRef<NodeJS.Timeout>(null);

  const stopStream = useCallback(() => {
    const { stream } = useDeviceStore.getState();
    if (!stream) {
      return;
    }

    setStreamStatus(null);

    stream.getTracks().forEach((device) => device.stop());

    useDeviceStore.getState().setAudioInput(null);
    useDeviceStore.getState().setAudioOutput(null);
    useDeviceStore.getState().setVideoInput(null);

    useDeviceStore.getState().setAudioInputList(null);
    useDeviceStore.getState().setAudioOutputList(null);
    useDeviceStore.getState().setVideoInputList(null);

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
    useDeviceStore.getState().setAudioOutput(deviceInfo.currentAudioOutput);
    useDeviceStore.getState().setVideoInput(deviceInfo.currentVideoInput);

    return deviceInfo;
  }, []);

  const updateDeviceEnable = () => {
    const { permission, deviceEnable } = useDeviceStore.getState();
    const audioDeviceId = (permission.audio && useDeviceStore.getState().audioInputList?.[0]?.deviceId) || undefined;
    const videoDeviceId = (permission.video && useDeviceStore.getState().videoInputList?.[0]?.deviceId) || undefined;

    useDeviceStore.getState().setDeviceEnable({
      audio: deviceEnable.audio && !!audioDeviceId,
      video: deviceEnable.video && !!videoDeviceId,
    });
  };

  const updateStream = useCallback(async () => {
    stopStream();
    console.log(useDeviceStore.getState().deviceEnable);
    setStreamStatus('pending');
    const permission = await updatePermission();
    console.log(useDeviceStore.getState().deviceEnable);
    const { deviceEnable } = useDeviceStore.getState();

    try {
      const newStream = await navigator.mediaDevices.getUserMedia(getStreamConstraint(permission, deviceEnable));
      console.log(useDeviceStore.getState().deviceEnable);
      await updateDeviceStatus(newStream);
      console.log(useDeviceStore.getState().deviceEnable);
      updateDeviceEnable();

      if (!deviceEnable.audio) {
        newStream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      console.log(useDeviceStore.getState().deviceEnable);

      useDeviceStore.getState().setStream(newStream);
      setStreamStatus('success');
      return newStream;
    } catch {
      setStreamStatus('rejected');
      useDeviceStore.getState().setStream(null);
      useDeviceStore.getState().setDeviceEnable({ audio: false, video: false });
      return null;
    }
  }, [updateDeviceStatus, updatePermission, stopStream]);

  const updateScreenStream = useCallback(async (audio: boolean) => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ audio });
      useDeviceStore.getState().setScreenStream(mediaStream);
      return mediaStream;
    } catch {
      throw new Error('화면 공유 스트림 가져오기 실패');
    }
  }, []);

  const toggleAudioInput = async () => {
    const { stream } = useDeviceStore.getState();
    if (useDeviceStore.getState().stream && useDeviceStore.getState().audioInputList.length !== 0) {
      useDeviceStore.getState().setDeviceEnable((prev) => {
        const newValue = !prev.audio;
        stream.getAudioTracks().forEach((track) => {
          track.enabled = newValue;
        });
        return { ...prev, audio: newValue };
      });
    }
  };

  const toggleVideoInput = async () => {
    const { stream } = useDeviceStore.getState();
    if (!stream) {
      return;
    }

    useDeviceStore.getState().setDeviceEnable((prev) => ({ ...prev, video: !prev.video }));
    if (useDeviceStore.getState().deviceEnable.video) {
      stream.getVideoTracks().forEach((track) => {
        track.stop();
      });
    }
  };

  useEffect(() => {
    return () => {
      deviceStream?.getTracks().forEach((track) => track.stop());
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [deviceStream]);

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
      const isEnableCheckPermission = await checkPermissionQuery();
      if (isEnableCheckPermission) {
        await addPermissionListener(async () => {
          stopStream();
          await updateStream();
        });
        return;
      }

      const checkTrack = async () => {
        if (!deviceStream.active) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          stopStream();
          await updateStream();
        }
      };

      timerRef.current = setInterval(checkTrack, 1000);
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
    if (enable.video) {
      updateStream();
    }
  }, [enable.video, updateStream]);

  return {
    updateStream,
    updateScreenStream,
    stopStream,
    stopScreenStream,
    streamStatus,
    toggleAudioInput,
    toggleVideoInput,
  };
};

export default useDevice;
