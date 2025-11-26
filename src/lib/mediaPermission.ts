
import { useDeviceStore } from '@/store/DeviceStore';

export const checkPermissionQuery = async () => {
  const { setPermission } = useDeviceStore.getState();
  if (!navigator.permissions) {
    return null;
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
      isFailed: false,
      video: Boolean(videoPermission.state === 'granted'),
    };
    setPermission(newPermission);
    return newPermission;
  } catch {
    return null;
  }
};

export const addPermissionListener = async (callback: () => void) => {
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

};


