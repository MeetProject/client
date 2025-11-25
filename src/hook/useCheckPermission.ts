import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useDeviceStore } from '@/store/DeviceStore';

const useCheckPermission = () => {
  const [isSupportedPermission, setIsSupportedPermission] = useState<null | boolean>(null);
  const { setDeviceEnable, setPermission } = useDeviceStore(
    useShallow((state) => ({
      permission: state.permission,
      setDeviceEnable: state.setDeviceEnable,
      setPermission: state.setPermission,
    })),
  );

  const checkPermissionQuery = useCallback(async () => {
    if (!navigator.permissions) {
      setIsSupportedPermission(false);
      return null;
    }

    try {
      const videoPermission = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      });
      const audioPermission = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });

      setIsSupportedPermission(true);

      if (audioPermission.state === 'prompt' || videoPermission.state === 'prompt') {
        return false;
      }

      const newPermission = {
        audio: Boolean(audioPermission.state === 'granted'),
        isFailed: false,
        video: Boolean(videoPermission.state === 'granted'),
      };
      setPermission(newPermission);
      return newPermission;
    } catch {
      setIsSupportedPermission(false);
      return null;
    }
  }, [setPermission]);

  const addPermissionListener = useCallback(async (callback: () => void) => {
    try {
      const videoPermission = await navigator.permissions.query({
        name: 'camera' as PermissionName,
      });
      const audioPermission = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });

      videoPermission.onchange = () => {
        callback();
      };
      audioPermission.onchange = () => {
        callback();
      };
    } catch {
      setIsSupportedPermission(false);
    }
  }, []);

  const checkPermission = useCallback(async (audio: boolean, video: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
      useDeviceStore.getState().setPermission({ audio, video });
      useDeviceStore.getState().setDeviceEnable((previous) => ({ audio: audio && previous.audio, video: video && previous.video }));
      stream?.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      const e = error as DOMException;
      if (e.name === 'NotAllowedError') {
        return false;
      }
      return 'failed';
    }
  }, []);

  const getStream = useCallback(async () => {
    if (isSupportedPermission === null || isSupportedPermission === true) {
      const newPermission = await checkPermissionQuery();
      if (newPermission) {
        return newPermission;
      }
    }

    let isFailed = false;

    const ATVT = await checkPermission(true, true);

    if (ATVT) {
      if (ATVT !== 'failed') {
        setPermission({ audio: true, video: true });
        throw new Error('stream rejected!');
      }
      isFailed = true;
    }

    const ATVF = await checkPermission(true, false);

    if (ATVF) {
      if (ATVF !== 'failed') {
        setPermission({ audio: true, video: false });
        return { audio: true, isFailed, video: false };
      }
      isFailed = true;
    }

    const AFVT = await checkPermission(false, true);

    if (AFVT) {
      if (AFVT !== 'failed') {
        setPermission({ audio: false, video: true });
        return { audio: false, isFailed, video: true };
      }
      isFailed = true;
    }
    setPermission({ audio: false, video: false });
    setDeviceEnable({ audio: false, video: false });

    return { audio: false, isFailed, video: false };
  }, [isSupportedPermission, checkPermissionQuery, checkPermission, setPermission, setDeviceEnable]);

  return {
    addPermissionListener,
    checkPermissionQuery,
    getStream,
    isSupportedPermission,
  };
};

export default useCheckPermission;
