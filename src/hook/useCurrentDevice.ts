import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { getCurrentDeviceInfo } from '@/lib/getCurrentDeviceInfo';
import { useDeviceStore } from '@/store/DeviceStore';

const useCurrentDevice = () => {
  const {
    permission,
    setAudioInput,
    setAudioInputList,
    setAudioOutput,
    setAudioOutputList,
    setVideoInput,
    setVideoInputList,
  } = useDeviceStore(
    useShallow((state) => ({
      permission: state.permission,
      setAudioInput: state.setAudioInput,
      setAudioInputList: state.setAudioInputList,
      setAudioOutput: state.setAudioOutput,
      setAudioOutputList: state.setAudioOutputList,
      setVideoInput: state.setVideoInput,
      setVideoInputList: state.setVideoInputList,
    })),
  );

  const updateDevice = useCallback(
    async (stream: MediaStream | null) => {
      if (!stream) {
        return;
      }

      const deviceInfo = await getCurrentDeviceInfo(stream);

      setVideoInput(deviceInfo.currentVideoInput ?? deviceInfo.currentVideoInputList[0]);
      setVideoInputList(deviceInfo.currentVideoInputList);

      setAudioInput(deviceInfo.currentAudioInput ?? deviceInfo.currentAudioInputList[0]);
      setAudioInputList(deviceInfo.currentAudioInputList);

      const currentAudioOutput =
        deviceInfo.currentAudioOutput ??
        (permission?.audio ? { id: '0', name: '시스템 오디오' } : { id: '', name: '' });

      setAudioOutput(currentAudioOutput);
      setAudioOutputList(deviceInfo.currentAudioOutputList);
    },
    [
      setAudioInput,
      setAudioOutput,
      setVideoInput,
      setAudioInputList,
      setAudioOutputList,
      setVideoInputList,
      permission,
    ],
  );

  return { updateDevice };
};

export default useCurrentDevice;
