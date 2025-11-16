import { AUDIO_CONSTRAINT } from '@/asset/constant/stream';

const getDeviceConstraint = (permission: boolean, id?: string) => {
  if (permission) {
    if (id) {
      return { deviceId: id };
    }
    return true;
  }
  return false;
};

export const getStreamConstraint = (
  permission: Record<'audio' | 'video' | 'isFailed', boolean>,
  enabled: Record<'audio' | 'video', boolean>,
  id?: Record<'audio' | 'video', string>,
) => {
  const audio = getDeviceConstraint(permission.audio, id?.audio);
  if (!audio) {
    return { audio: false, video: getDeviceConstraint(permission.video && enabled.video, id?.video) };
  }
  if (audio === true) {
    return { audio: AUDIO_CONSTRAINT, video: getDeviceConstraint(permission.video && enabled.video, id?.video) };
  }
  return {
    audio: { ...audio, ...AUDIO_CONSTRAINT },
    video: getDeviceConstraint(permission.video && enabled.video, id?.video),
  };
};
