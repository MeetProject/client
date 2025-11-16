'use client';

import { useShallow } from 'zustand/react/shallow';
import { StreamStatusType } from '@/type/streamType';
import { useDeviceStore } from '@/store/DeviceStore';

interface VideoNotificationProps {
  status: StreamStatusType;
  onClickButton: () => void;
}

export default function VideoNotification({ status, onClickButton }: VideoNotificationProps) {
  const { permission, deviceEnable, videoInput } = useDeviceStore(
    useShallow((state) => ({
      permission: state.permission,
      deviceEnable: state.deviceEnable,
      videoInput: state.videoInput,
    })),
  );

  const getStreamMessage = () => {
    if (status === 'failed' || status === 'rejected' || (permission && !permission.video)) {
      return '카메라를 사용할 수 없음';
    }

    if (!deviceEnable.video && videoInput?.id) {
      return '카메라가 꺼져 있음';
    }

    if (status === 'pending') {
      return '카메라 시작 중';
    }

    return '';
  };

  const handleCheckPermissionButtonClick = () => {
    onClickButton();
  };

  if (permission && permission.video && status === 'success' && deviceEnable.video) {
    return;
  }

  return (
    <div className='absolute top-0 flex size-full items-center justify-center bg-[#202124] font-googleSans text-2xl text-white'>
      {status !== null && (status === 'rejected' || (permission && !permission.video && status !== 'failed')) ? (
        <div className='flex flex-col items-center justify-center p-[5px]'>
          <div className='text-center'>회의에서 참여자들이 나를 보고 듣도록 하시겠습니까?</div>
          <button
            type='button'
            onClick={handleCheckPermissionButtonClick}
            className='my-[15px] min-w-[185px] rounded bg-[#1A73E8] px-6 py-2 text-center text-sm'
          >
            {permission && permission.audio ? '비디오 허용' : '마이크 및 카메라 허용'}
          </button>
        </div>
      ) : (
        getStreamMessage()
      )}
    </div>
  );
}
