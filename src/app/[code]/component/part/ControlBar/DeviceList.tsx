'use client';

import { useShallow } from 'zustand/react/shallow';
import { useDeviceStore } from '@/store/DeviceStore';

import * as Icon from '@/asset/icon';
import { setTrackChage } from '@/lib/setTrackChange';
import { DeviceButton } from '../Device';

interface DeviceListProps {
  type: 'audio' | 'video';
}

export default function DeviceList({ type }: DeviceListProps) {
  const { stream, audioInput, audioOutput, videoInput, audioInputList, audioOutputList, videoInputList } =
    useDeviceStore(
      useShallow((state) => ({
        stream: state.stream,
        streamStatus: state.streamStatus,
        audioInput: state.audioInput,
        audioOutput: state.audioOutput,
        videoInput: state.videoInput,
        audioInputList: state.audioInputList,
        audioOutputList: state.audioOuputList,
        videoInputList: state.videoInputList,
      })),
    );

  const handleTrackChange = async (device: MediaDeviceInfo, trackType: 'audioInput' | 'videoInput' | 'audioOutput') => {
    setTrackChage(stream, device, trackType);
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
