import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import * as Icon from '@/asset/icon';
import { DeviceSelectBox } from '@/component';
import { useDevice2 } from '@/hook';
import { useDeviceStore } from '@/store/DeviceStore';

export default function VideoSetting() {
  const videoReference = useRef<HTMLVideoElement>(null);
  const { changeTrack } = useDevice2();
  const { permission, setVideoInput, stream, videoInput, videoInputList } = useDeviceStore(
    useShallow((state) => ({
      permission: state.permission,
      setVideoInput: state.setVideoInput,
      stream: state.stream,
      videoInput: state.videoInput,
      videoInputList: state.videoInputList,
    })),
  );

  const handleVideoChange = (device: MediaDeviceInfo) => {
    changeTrack(device, 'videoInput');
  };

  useEffect(() => {
    if (stream && videoReference.current) {
      videoReference.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className='flex flex-col gap-6 flex-1'>
      <div className='flex items-center sm:block gap-4'>
        <div className='min-w-[100px]' style={{ flex: '1 1 100px' }}>
          <div>
            <p className='mb-2 text-sm font-medium text-[#1A73E8]'>카메라</p>
          </div>
          <div className='flex items-center gap-4 flex-1 sm:flex-col-reverse'>
            <DeviceSelectBox
              currentValue={videoInput}
              deviceList={videoInputList}
              onChange={handleVideoChange}
              DeviceIcon={Icon.VideoOn}
              disabled={permission?.video ? false : '권한'}
            />
            <div className='flex justify-center bg-gray-700 overflow-hidden rounded-md w-fit'>
              {permission?.video && (
                <video
                  autoPlay
                  muted
                  ref={videoReference}
                  className='aspect-video w-40 object-cover sm:w-full sm:rounded-md'
                  style={{ transform: 'rotateY(180deg)' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
