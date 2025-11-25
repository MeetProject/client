'use client';

import { ReactNode, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import * as Icon from '@/asset/icon';
import { useOutsideClick, useVolume } from '@/hook';
import { useDeviceStore } from '@/store/DeviceStore';

import DeviceCard from './DeviceCard';
import DeviceSubButton from './DeviceSubButton';

interface DeviceButtonIcon {
  icon: ReactNode;
  currentDevice: Record<'name' | 'id', string>;
  deviceList: MediaDeviceInfo[];
  type: 'audioInput' | 'audioOutput' | 'videoInput';
  onTrackChange?: (device?: MediaDeviceInfo, type?: 'audioInput' | 'audioOutput' | 'videoInput') => Promise<void>;
  color?: 'black' | 'white';
  width?: number;
}

export default function DeviceButton({
  color = 'white',
  currentDevice,
  deviceList,
  icon,
  onTrackChange,
  type,
  width,
}: DeviceButtonIcon) {
  const [isOpen, setIsOpen] = useState(false);
  const { permission, stream, streamStatus } = useDeviceStore(
    useShallow((state) => ({ permission: state.permission, stream: state.stream, streamStatus: state.streamStatus })),
  );

  const getDisabledStatus = () => {
    if (streamStatus === 'rejected') {
      return 'permission';
    }

    if (!currentDevice) {
      return 'failed';
    }

    if (type === 'audioInput' || type === 'audioOutput') {
      if (permission && !permission.audio) {
        return 'permission';
      }
    }

    if (type === 'videoInput') {
      if (permission && !permission.video) {
        return 'permission';
      }
      if (streamStatus === 'failed') {
        return 'failed';
      }
    }

    return false;
  };

  const isDisabled = getDisabledStatus();

  const { volume } = useVolume(stream);

  const handleOutSideClick = () => {
    setIsOpen(false);
  };

  const { targetRef } = useOutsideClick<HTMLDivElement>(handleOutSideClick);

  const { setAudioInput, setAudioOutput, setVideoInput } = useDeviceStore(
    useShallow((state) => ({
      setAudioInput: state.setAudioInput,
      setAudioOutput: state.setAudioOutput,
      setVideoInput: state.setVideoInput,
    })),
  );

  const handleButtonClick = () => {
    setIsOpen((previous) => !previous);
  };

  const handleCardClick = async (device: MediaDeviceInfo) => {
    if (device.deviceId === currentDevice?.id) {
      return;
    }

    if (type === 'audioInput') {
      setAudioInput({ id: device.deviceId, name: device.label });
    }

    if (type === 'videoInput') {
      setVideoInput({ id: device.deviceId, name: device.label });
    }
    if (type === 'audioOutput') {
      setAudioOutput({ id: device.deviceId, name: device.label });
    }

    if (onTrackChange) {
      await onTrackChange(device, type);
    }
  };

  const getStatusText = () => {
    if (isDisabled === 'permission') {
      return '권한 필요';
    }
    if (type === 'audioInput') {
      if (isDisabled === 'failed') {
        return '마이크를 찾을 수 없습니다';
      }
    }

    if (type === 'audioOutput') {
      if (isDisabled === 'failed') {
        return '스피커를 찾을 수 없습니다';
      }
    }

    if (type === 'videoInput') {
      if (isDisabled === 'failed') {
        return '카메라를 찾을 수 없습니다';
      }
    }
    return '';
  };
  const disabledText = getStatusText();

  return (
    <div className='relative m-px font-googleSans' ref={targetRef}>
      <button
        type='button'
        onClick={handleButtonClick}
        disabled={isDisabled !== false}
        className={`flex h-[34px] items-center rounded-full border-[0.8px] border-solid ${color === 'black' ? 'border-[#5F6368]' : isDisabled ? 'border-[#E7E8E8]' : 'border-white  hover:border-[#DADCE0] active:bg-[#F6FAFE]'} px-[10px]`}
      >
        <div className='mr-2 flex size-[18px] items-center justify-center'>{icon}</div>
        <p
          className={`truncate text-left text-sm ${color === 'black' ? 'text-white' : isDisabled ? 'text-[#B5B6B7]' : 'text-[#5f6368]'}`}
          style={{ width: width ? `${width - 65}px` : '105px' }}
        >
          {isDisabled ? disabledText : currentDevice.name}
        </p>
        <div className='w-[18px]'>
          <Icon.Chevron
            width={12}
            height={12}
            fill={color === 'black' ? '#8AB4F8' : isDisabled ? '#B5B6B7' : '#5F6368'}
          />
        </div>
      </button>
      {isOpen && (
        <div
          className={`absolute bottom-9 max-h-[609px] min-w-[320px] rounded ${color === 'black' ? 'bg-[#37383B]' : 'bg-white'} py-2 `}
          style={{
            boxShadow: '0 3px 5px -1px rgba(0,0,0,.2),0 6px 10px 0 rgba(0,0,0,.14),0 1px 18px 0 rgba(0,0,0,.12)',
          }}
        >
          <div>
            {deviceList?.map((device) => (
              <DeviceCard
                key={device.deviceId}
                device={device}
                isChoosed={device.deviceId === currentDevice?.id}
                onClick={handleCardClick}
                color={color}
              />
            ))}
          </div>
          <DeviceSubButton type={type} volume={volume} color={color} />
        </div>
      )}
    </div>
  );
}
