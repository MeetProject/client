'use client';

import { useEffect, useRef } from 'react';
import * as Icon from '@/asset/icon';
import { useDeviceStore } from '@/store/DeviceStore';

interface DeviceSubButtonProps {
  type: 'audioInput' | 'audioOutput' | 'videoInput';
  volume?: number;
  color: 'black' | 'white';
}

export default function DeviceSubButton({ type, volume, color }: DeviceSubButtonProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const deviceEnable = useDeviceStore((state) => state.deviceEnable);
  const { audioOutput } = useDeviceStore();

  const handleAudioButtonClick = () => {
    if (audioRef.current) {
      if (audioRef.current.setSinkId) {
        audioRef.current.setSinkId(audioOutput?.id);
      }

      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [audioOutput]);

  if (type === 'videoInput' || (type === 'audioInput' && volume === undefined)) {
    return null;
  }
  return (
    <>
      <hr className={`my-2 h-px w-full ${color === 'black' ? 'border-[#47484B]' : 'border-[#E0E0E0]'} `} />
      {type === 'audioInput' && volume !== undefined ? (
        <div className='flex h-10 items-center px-4'>
          <div className='mr-4 flex size-6 items-center justify-center'>
            {deviceEnable.audio ? (
              <Icon.MicOn width={18} height={18} fill={color === 'black' ? '#E8EAED' : '#202124'} />
            ) : (
              <Icon.MicOff width={20} height={20} fill={color === 'black' ? '#E8EAED' : '#B5B6B7'} />
            )}
          </div>
          {deviceEnable.audio ? (
            <div
              className={`mx-2 my-4 h-1 w-full overflow-hidden rounded-sm ${color === 'black' ? 'bg-[#202124]' : 'bg-[#F1F3F4]'}`}
            >
              <div className='h-full bg-[#1A73E8]' style={{ width: `${Math.min(volume * 2.2, 100)}%` }} />
            </div>
          ) : (
            <div className={`w-full text-sm ${color === 'black' ? 'text-[#76777A]' : 'text-[#B6B7B8]'}`}>
              테스트하려면 마이크를 켜세요
            </div>
          )}
        </div>
      ) : (
        <button
          type='button'
          className={`flex h-10 w-full items-center px-4 ${color === 'black' ? 'hover:bg-[#37383B] active:bg-[#494A4D]' : 'hover:bg-[#F5F5F5] active:bg-[#D7D7D7]'} `}
          onClick={handleAudioButtonClick}
        >
          <div className='mr-4 flex size-6 items-center justify-center'>
            <Icon.Sound width={18} height={18} fill={color === 'black' ? '#E8EAED' : '#202124'} />
          </div>
          <div className={`text-sm ${color === 'black' && 'text-white'}`}>스피커 테스트</div>
        </button>
      )}
      <audio ref={audioRef} src='/audio/soundTest.mp3' />
    </>
  );
}
