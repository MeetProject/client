import { useDeviceStore } from '@/store/DeviceStore';

export const setTrackChage = async (
  stream: MediaStream | null | undefined,
  device: MediaDeviceInfo,
  type: 'audioInput' | 'videoInput' | 'audioOutput',
) => {
  if (type === 'audioOutput') {
    const mediaElements = document.querySelectorAll('audio, video');

    mediaElements.forEach((element) => {
      const mediaElement = element as HTMLMediaElement;
      if (mediaElement.setSinkId) {
        mediaElement.setSinkId(device.deviceId);
      }
    });
    return;
  }
  if (stream) {
    const { audioInput, setStream, videoInput } = useDeviceStore.getState();
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio:
        type === 'audioInput'
          ? { deviceId: { exact: device.deviceId } }
          : audioInput
            ? { deviceId: { exact: audioInput.id } }
            : false,
      video:
        type === 'videoInput'
          ? { deviceId: { exact: device.deviceId } }
          : videoInput
            ? { deviceId: { exact: videoInput.id } }
            : false,
    });
    setStream(newStream);
  }
};
