import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import * as Icon from '@/asset/icon';
import { DeviceSelectBox } from '@/component';
import { useDevice2 } from '@/hook';
import { useDeviceStore } from '@/store/DeviceStore';

export default function VideoSetting() {
  const videoReference = useRef<HTMLVideoElement>(null);
  const { updateStream } = useDevice2();
  const { permission, setVideoInput, stream, videoInput, videoInputList } = useDeviceStore(
    useShallow((state) => ({
      permission: state.permission,
      setVideoInput: state.setVideoInput,
      stream: state.stream,
      videoInput: state.videoInput,
      videoInputList: state.videoInputList,
    })),
  );

  const handleVideoChange = (id: string) => {
    const newVideo = videoInputList.find((track) => track.deviceId === id);
    if (!newVideo) {
      return;
    }
    setVideoInput({ id: newVideo.deviceId, name: newVideo.label });
    updateStream();
  };

  useEffect(() => {
    if (stream && videoReference.current) {
      videoReference.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className='flex items-center sm:block'>
      <div className='min-w-[100px]' style={{ flex: '1 1 100px' }}>
        <div>
          <p className='mb-2 text-sm font-medium text-[#1A73E8]'>카메라</p>
        </div>
        <DeviceSelectBox
          currentValue={videoInput}
          deviceList={videoInputList}
          onChange={handleVideoChange}
          DeviceIcon={Icon.VideoOn}
          disabled={permission?.video ? false : '권한'}
        />
      </div>
      <div className='ml-6 flex w-40 items-center justify-center pt-7'>
        {permission?.video ? (
          <video
            autoPlay
            muted
            ref={videoReference}
            className='aspect-video h-[58px] object-cover'
            style={{ transform: 'rotateY(180deg)' }}
          />
        ) : (
          <div className='flex h-14 w-[160px] items-center justify-center bg-[#F1F3F4] text-sm text-[#202124]'>
            카메라 차단됨
          </div>
        )}
      </div>
    </div>
  );
}
