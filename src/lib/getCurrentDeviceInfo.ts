export const getCurrentDeviceInfo = async (stream: MediaStream) => {
  const deviceInfo = await navigator.mediaDevices.enumerateDevices();

  const videoInputList = deviceInfo.filter(
    (device) => device.kind === 'videoinput' && device.deviceId !== 'default' && device.deviceId !== 'communications',
  );

  const audioInputList = deviceInfo.filter(
    (device) => device.kind === 'audioinput' && device.deviceId !== 'default' && device.deviceId !== 'communications',
  );

  const audioOutputList = deviceInfo.filter(
    (device) => device.kind === 'audiooutput' && device.deviceId !== 'default' && device.deviceId !== 'communications',
  );

  const audioTrack = stream.getAudioTracks()[0];
  const videoTrack = stream.getVideoTracks()[0];

  const audioDeviceId = audioTrack?.getSettings?.().deviceId;
  const videoDeviceId = videoTrack?.getSettings?.().deviceId;

  const currentAudioInput = audioInputList.find((d) => d.deviceId === audioDeviceId) ?? null;
  const currentVideoInput = videoInputList.find((d) => d.deviceId === videoDeviceId) ?? null;
  const currentAudioOutput = deviceInfo.find((device) => device.kind === 'audiooutput');

  return {
    audioTrack: currentAudioInput,
    currentAudioInput: currentAudioInput,
    currentAudioInputList: audioInputList,
    currentAudioOutput: currentAudioOutput,
    currentAudioOutputList: audioOutputList,
    currentVideoInput: currentVideoInput,
    currentVideoInputList: videoInputList,
    videoTrack: currentVideoInput,
  };
};
