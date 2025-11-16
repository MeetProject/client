'use client';

import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { setTrackChage } from '@/lib/setTrackChange';
import { useDevice2 } from '@/hook';
import { useDeviceStore } from '@/store/DeviceStore';
import * as Icon from '@/asset/icon';
import { Visualizer } from '@/component';
import { PermissionModal, VideoNotification, DeviceButton } from './part/Device';

export default function Device() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    permission,
    deviceEnable,
    audioInput,
    audioOutput,
    videoInput,
    audioInputList,
    audioOutputList,
    videoInputList,
  } = useDeviceStore(
    useShallow((state) => ({
      permission: state.permission,
      deviceEnable: state.deviceEnable,
      audioInput: state.audioInput,
      audioOutput: state.audioOutput,
      videoInput: state.videoInput,
      audioInputList: state.audioInputList,
      audioOutputList: state.audioOuputList,
      videoInputList: state.videoInputList,
    })),
  );

  const { stream } = useDeviceStore(
    useShallow((state) => ({
      stream: state.stream,
    })),
  );

  const { streamStatus, toggleVideoInput, toggleAudioInput, updateStream } = useDevice2();

  /* const { stream, streamStatus, toggleVideoInput, toggleAudioInput, handleUpdateStream } = useDevice(); */

  const [isOpenModal, setIsOpenModal] = useState(false);
  const audioDisabled = !audioInput?.id;
  const videoDisabled = streamStatus === 'rejected' || (permission && !permission.video);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleMicButton = () => {
    if (stream && !audioDisabled) {
      toggleAudioInput();
    }
    if (audioDisabled) {
      setIsOpenModal(true);
    }
  };

  const handleVideoButton = () => {
    if (stream && !videoDisabled) {
      toggleVideoInput();
    }
    if (videoDisabled) {
      setIsOpenModal(true);
    }
  };

  const handleTrackChange = async (device: MediaDeviceInfo, type: 'audioInput' | 'videoInput' | 'audioOutput') => {
    setTrackChage(stream, videoRef, device, type);
  };

  const handleVideoButtonClick = () => {
    setIsOpenModal(true);
  };

  const handleModalClose = () => {
    setIsOpenModal(false);
  };

  useEffect(() => {
    updateStream();
  }, [updateStream]);

  return (
    <div className='w-full max-w-[764px] p-4 pr-2 lg:h-[284px] lg:pr-4'>
      <div
        className='relative aspect-video size-full overflow-hidden rounded-lg'
        style={{
          boxShadow: '0 1px 2px 0 rgba(60, 64, 67, .3), 0 1px 3px 1px rgba(60, 64, 67, .15)',
        }}
      >
        <video
          autoPlay
          ref={videoRef}
          className='aspect-video size-full object-cover'
          style={{ transform: 'rotateY(180deg)' }}
        />
        <VideoNotification status={streamStatus} onClickButton={handleVideoButtonClick} />
        {deviceEnable.audio && permission?.audio && (
          <div className='absolute bottom-4 left-4'>
            <Visualizer stream={stream} />
          </div>
        )}

        <div className='absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-6 px-3'>
          {streamStatus !== null && (
            <button
              type='button'
              onClick={handleMicButton}
              className={`relative flex items-center justify-center border border-solid shadow-sm ${deviceEnable.audio && permission?.audio ? 'border-white' : 'border-[#EA4335] bg-[#EA4335]'} size-14 rounded-full`}
            >
              {deviceEnable.audio && permission?.audio ? (
                <Icon.MicOn width={24} height={24} fill='#ffffff' />
              ) : (
                <Icon.MicOff width={24} height={24} fill='#ffffff' />
              )}
              {audioDisabled && streamStatus !== null && (
                <div className='absolute right-0 top-0 size-3 rounded-full bg-white'>
                  <Icon.Warn width={20} height={20} fill='#FA7B17' className='relative -left-1 -top-1' />
                </div>
              )}
            </button>
          )}

          {streamStatus !== null && (
            <button
              type='button'
              onClick={handleVideoButton}
              className={`relative flex items-center justify-center border border-solid shadow-sm ${permission?.video ? 'border-white' : 'border-[#EA4335] bg-[#EA4335]'} size-14 rounded-full`}
            >
              {deviceEnable.video ? (
                <Icon.VideoOn width={24} height={24} fill='#ffffff' />
              ) : (
                <Icon.VideoOff width={24} height={24} fill='#ffffff' />
              )}
              {videoDisabled && (
                <div className='absolute right-0 top-0 size-3 rounded-full bg-white'>
                  <Icon.Warn width={20} height={20} fill='#FA7B17' className='relative -left-1 -top-1' />
                </div>
              )}
            </button>
          )}
        </div>
      </div>
      <div className='mt-4 flex h-9 w-full items-center gap-1 lg:hidden'>
        {streamStatus !== null && (
          <DeviceButton
            icon={
              <Icon.MicOn
                width={14}
                height={14}
                fill={
                  (streamStatus === 'failed' && !audioInput?.id) ||
                  streamStatus === 'rejected' ||
                  (permission && !permission.audio)
                    ? '#B5B6B7'
                    : '#5F6368'
                }
              />
            }
            currentDevice={audioInput}
            deviceList={audioInputList}
            type='audioInput'
            onTrackChange={handleTrackChange}
            status={streamStatus}
          />
        )}

        {streamStatus !== null && (
          <DeviceButton
            icon={
              <Icon.Sound
                width={14}
                height={14}
                fill={
                  (streamStatus === 'failed' && !audioOutput?.id) ||
                  streamStatus === 'rejected' ||
                  (permission && !permission.audio)
                    ? '#B5B6B7'
                    : '#5F6368'
                }
              />
            }
            currentDevice={audioOutput}
            deviceList={audioOutputList}
            type='audioOutput'
            onTrackChange={handleTrackChange}
            status={streamStatus}
          />
        )}

        {streamStatus !== null && (
          <DeviceButton
            icon={
              <Icon.VideoOn
                width={14}
                height={14}
                fill={
                  streamStatus === 'failed' || streamStatus === 'rejected' || (permission && !permission.video)
                    ? '#B5B6B7'
                    : '#5F6368'
                }
              />
            }
            currentDevice={videoInput}
            deviceList={videoInputList}
            type='videoInput'
            onTrackChange={handleTrackChange}
            status={streamStatus}
          />
        )}
      </div>
      <PermissionModal
        isOpenModal={isOpenModal}
        status={streamStatus}
        onClose={handleModalClose}
        onUpdateStream={updateStream}
      />
    </div>
  );
}
