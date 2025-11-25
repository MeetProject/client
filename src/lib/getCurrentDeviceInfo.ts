const getDevice = (deviceList: MediaDeviceInfo[], currentDevice: MediaStreamTrack | MediaDeviceInfo | undefined) => {
  if (deviceList.length === 0 || !currentDevice) {
    return { id: '', name: '' };
  }

  const target = deviceList.find((device) => currentDevice.label.includes(device.label));

  if (!target) {
    return { id: deviceList[0].deviceId, name: deviceList[0].label };
  }

  return { id: target.deviceId, name: target.label };
};

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

  const currentAudioInput = stream.getAudioTracks()[0];
  const currentVideoInput = stream.getVideoTracks()[0];
  const currentAudioOutput = deviceInfo.filter((device) => device.kind === 'audiooutput')[0];

  return {
    audioTrack: currentAudioInput,
    currentAudioInput: getDevice(audioInputList, currentAudioInput),
    currentAudioInputList: audioInputList,
    currentAudioOutput: getDevice(audioOutputList, currentAudioOutput),
    currentAudioOutputList: audioOutputList,
    currentVideoInput: getDevice(videoInputList, currentVideoInput),
    currentVideoInputList: videoInputList,
    videoTrack: currentVideoInput,
  };
};
