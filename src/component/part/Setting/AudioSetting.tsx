import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDeviceStore } from '@/store/DeviceStore';
import { DeviceSelectBox, Visualizer } from '@/component';
import * as Icon from '@/asset/icon';
import { useDevice2 } from '@/hook';

export default function AudioSetting() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlay, setIsPlay] = useState(false);

  const { updateStream } = useDevice2();

  const { stream, audioInputList, audioOuputList, audioInput, audioOutput, setAudioInput, setAudioOutput, permission } =
    useDeviceStore(
      useShallow((state) => ({
        stream: state.stream,
        audioInputList: state.audioInputList,
        audioOuputList: state.audioOuputList,
        audioInput: state.audioInput,
        audioOutput: state.audioOutput,
        setAudioInput: state.setAudioInput,
        setAudioOutput: state.setAudioOutput,
        permission: state.permission,
      })),
    );

  const handleAudioChange = (id: string, type: 'input' | 'output') => {
    const newValue =
      type === 'input'
        ? audioInputList.find((audio) => audio.deviceId === id)
        : audioOuputList.find((audio) => audio.deviceId === id);

    if (!newValue) {
      return;
    }

    if (type === 'input') {
      setAudioInput({ id: newValue.deviceId, name: newValue.label });
      updateStream();
      return;
    }

    setAudioOutput({ id: newValue.deviceId, name: newValue.label });
    setIsPlay(false);
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.setSinkId) {
        audioRef.current.setSinkId(newValue.deviceId);
        audioRef.current.setSinkId(newValue.deviceId);
      }
    }
  };

  const handleAudioTestButton = () => {
    if (!audioRef.current || isPlay) {
      return;
    }
    setIsPlay(true);
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    timerRef.current = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlay(false);
      timerRef.current = null;
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center sm:block'>
        <div className='min-w-[100px]' style={{ flex: '1 1 100px' }}>
          <div>
            <p className='mb-2 text-sm font-medium text-[#1A73E8]'>마이크</p>
          </div>
          <DeviceSelectBox
            currentValue={audioInput}
            deviceList={audioInputList}
            onChange={(id: string) => handleAudioChange(id, 'input')}
            DeviceIcon={Icon.MicOn}
            disabled={permission?.audio ? false : '권한'}
          />
        </div>
        <div className='ml-6 flex w-40 items-center justify-center pt-7 sm:ml-0 sm:w-full'>
          {permission?.audio ? (
            <Visualizer stream={stream} />
          ) : (
            <div className='flex h-14 items-center bg-[#F1F3F4] px-[6px] text-sm text-[#202124]'>마이크가 차단됨</div>
          )}
        </div>
      </div>
      <div className='flex items-center sm:block'>
        <div className='min-w-[100px]' style={{ flex: '1 1 100px' }}>
          <div>
            <p className='mb-2 text-sm font-medium text-[#1A73E8]'>스피커</p>
          </div>
          <DeviceSelectBox
            currentValue={audioOutput}
            deviceList={audioOuputList}
            onChange={(id: string) => handleAudioChange(id, 'output')}
            DeviceIcon={Icon.Sound}
            disabled={permission?.audio ? (audioOuputList.length === 0 ? '시스템' : false) : '권한'}
          />
        </div>
        <div className='ml-6 flex w-40 items-center justify-center pt-7'>
          <button
            type='button'
            onClick={handleAudioTestButton}
            disabled={isPlay}
            className='h-10 rounded-full px-3 text-sm text-[#444746] hover:bg-[#ECF2FC] hover:text-[#0B57D0] active:bg-[#D5E2F7]'
          >
            {isPlay ? '재생 중' : '테스트'}
          </button>
        </div>
      </div>
      <audio ref={audioRef} src='/audio/soundTest.mp3' />
    </div>
  );
}
