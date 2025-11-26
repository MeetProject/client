'use client';

import { useShallow } from 'zustand/react/shallow';

import * as Icon from '@/asset/icon';
import { useDevice2 } from '@/hook';
import { useDeviceStore } from '@/store/DeviceStore';
import { DeviceType } from '@/type/streamType';

import { DeviceButton } from '../Device';

interface DeviceListProperties {
  type: 'audio' | 'video';
}

export default function DeviceList({ type }: DeviceListProperties) {
  const {changeTrack} = useDevice2();
  const { audioInput, audioInputList, audioOutput, audioOutputList, stream, videoInput, videoInputList } =
    useDeviceStore(
      useShallow((state) => ({
        audioInput: state.audioInput,
        audioInputList: state.audioInputList,
        audioOutput: state.audioOutput,
        audioOutputList: state.audioOuputList,
        stream: state.stream,
        streamStatus: state.streamStatus,
        videoInput: state.videoInput,
        videoInputList: state.videoInputList,
      })),
    );

  const handleTrackChange = async (device: MediaDeviceInfo, trackType: DeviceType) => {
    changeTrack(device, trackType);
  };

  return (
    <div className='absolute top-0 z-50 flex -translate-y-full items-center gap-[10px] rounded-[36px] bg-[#2C2C2C] p-[10px] duration-500 md:hidden'>
      {type === 'audio' ? (
        <>
          <DeviceButton
            type='audioInput'
            icon={<Icon.MicOn width={14} height={14} fill='#8AB4F8' />}
            deviceList={audioInputList}
            currentDevice={audioInput}
            color='black'
            onTrackChange={handleTrackChange}
            width={244}
          />
          <DeviceButton
            type='audioOutput'
            icon={<Icon.Sound width={14} height={14} fill='#8AB4F8' />}
            deviceList={audioOutputList}
            currentDevice={audioOutput}
            onTrackChange={handleTrackChange}
            color='black'
            width={244}
          />
        </>
      ) : (
        <DeviceButton
          type='videoInput'
          icon={<Icon.VideoOn width={14} height={14} fill='#8AB4F8' />}
          deviceList={videoInputList}
          currentDevice={videoInput}
          color='black'
          onTrackChange={handleTrackChange}
          width={462}
        />
      )}
    </div>
  );
}
