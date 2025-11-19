'use client';

import { ReactNode, useCallback, useState } from 'react';
import * as Icon from '@/asset/icon';
import { ToggleType } from '@/type/toggleType';
import { useDeviceStore } from '@/store/DeviceStore';
import { Alert } from '@/component';
import { checkBrowser } from '@/lib/checkBrowser';
import { DeviceEnableType } from '@/type/streamType';
import { useDevice2 } from '@/hook';
import { ControlButton, MenuButton, OptionButton, CallEndButton } from './part/ControlBar';
import { PermissionModal } from './part/Device';

interface ControlBarProps {
  handleScreenShare: () => void;
  handleStopScreenShare: () => void;
  handleLeavSession: () => void;
  handleDeviceEnable: (device: DeviceEnableType) => void;
  handleHandUp: (value: boolean) => void;
}

interface ControlButtonType {
  name: string;
  type: ToggleType;
  icon: ReactNode;
  clickedIcon: ReactNode;
  disabledIcon?: ReactNode;
  onClick?: (value: boolean | 'disable') => void;
  shortcutKey?: string[];
  hidden?: boolean;
}

const CONTROL_BUTTON_OFF_PROPS = { width: 24, height: 24, fill: '#06306D' };
const CONTROL_BUTTON_ON_PROPS = { width: 24, height: 24, fill: '#E3E3E3' };

export default function ControlBar({
  handleScreenShare,
  handleStopScreenShare,
  handleLeavSession,
  handleDeviceEnable,
  handleHandUp,
}: ControlBarProps) {
  const [isOpenAlert, setIsOpenAlert] = useState(false);
  const handleScreenShareButtonClick = (value: boolean | 'disable') => {
    if (value === 'disable') {
      setIsOpenAlert(true);
      return;
    }
    if (value) {
      handleScreenShare();
      return;
    }
    handleStopScreenShare();
  };

  const handleHandsUpButtonClick = (value: boolean | 'disable') => {
    if (value === 'disable') {
      return;
    }
    handleHandUp(value);
  };

  const isSupportScreenShareBrowser = checkBrowser();

  const CONTROL_BUTTON: ControlButtonType[] = [
    /* {
      name: '자막 사용(c)',
      type: 'caption',
      icon: <Icon.Cc {...CONTROL_BUTTON_OFF_PROPS} />,
      clickedIcon: <Icon.Cc {...CONTROL_BUTTON_ON_PROPS} />,
    }, */
    {
      name: '반응 보내기',
      type: 'emoji',
      icon: <Icon.EmojiOff {...CONTROL_BUTTON_OFF_PROPS} />,
      clickedIcon: <Icon.EmojiOn {...CONTROL_BUTTON_ON_PROPS} />,
    },
    {
      name: '발표 시작',
      type: 'screen',
      icon: <Icon.ScreenShare {...CONTROL_BUTTON_OFF_PROPS} />,
      clickedIcon: <Icon.ScreenShare {...CONTROL_BUTTON_ON_PROPS} />,
      disabledIcon: <Icon.ScreenShare {...{ ...CONTROL_BUTTON_OFF_PROPS, fill: '#AFB5C4' }} />,
      onClick: handleScreenShareButtonClick,
      hidden: !isSupportScreenShareBrowser,
    },
    {
      name: '손들기(ctrl + alt + h)',
      type: 'handsUp',
      icon: <Icon.HandOff {...CONTROL_BUTTON_OFF_PROPS} />,
      clickedIcon: <Icon.HandOn {...CONTROL_BUTTON_ON_PROPS} />,
      onClick: handleHandsUpButtonClick,
      shortcutKey: ['Control', 'Alt', 'h'],
    },
  ];
  const [isOpenModal, setIsOpenModal] = useState(false);

  const { toggleAudioInput, toggleVideoInput } = useDevice2();

  const handleModalClose = () => {
    setIsOpenModal(false);
  };

  const handleAlertClose = () => {
    setIsOpenAlert(false);
  };

  const handleButtonClick = useCallback(
    (type: 'audio' | 'video') => {
      const { permission, deviceEnable } = useDeviceStore.getState();
      if (permission && permission[type]) {
        handleDeviceEnable({ ...deviceEnable, [type]: !deviceEnable[type] });
        if (type === 'audio') {
          toggleAudioInput();
          return;
        }
        toggleVideoInput();
        return;
      }
      setIsOpenModal(true);
    },
    [handleDeviceEnable, toggleAudioInput, toggleVideoInput],
  );

  return (
    <div className='absolute left-1/2 top-1/2 z-30 flex h-12 shrink-0 -translate-x-1/2 -translate-y-1/2 items-center gap-2 bg-[#212121] sm-md:relative sm-md:left-auto sm-md:top-auto sm-md:translate-x-0 sm-md:translate-y-0'>
      <OptionButton
        type='audio'
        onClickButton={handleButtonClick}
        icon={<Icon.MicOn width={24} height={24} fill='#E3E3E3' />}
        clickedIcon={<Icon.MicOff width={24} height={24} fill='#5F1312' />}
        name={{ chevron: '오디오 설정', iconOn: '마이크 끄기(ctrl + d)', iconOff: '마이크 켜기(ctrl + d)' }}
        shortcutKey={['Control', 'd']}
      />
      <OptionButton
        type='video'
        onClickButton={handleButtonClick}
        icon={<Icon.VideoOn width={24} height={24} fill='#E3E3E3' />}
        clickedIcon={<Icon.VideoOff width={24} height={24} fill='#5F1312' />}
        name={{ chevron: '영상 설정', iconOn: '비디오 끄기(ctrl + e)', iconOff: '비디오 켜기(ctrl + e)' }}
        shortcutKey={['Control', 'e']}
      />
      {CONTROL_BUTTON.map((button) => (
        <ControlButton key={button.type} {...button} />
      ))}
      <MenuButton />
      <CallEndButton onClick={handleLeavSession} />
      <PermissionModal isOpenModal={isOpenModal} onClose={handleModalClose} />
      <Alert text='다른 사람이 화면 공유 중 입니다.' isOpen={isOpenAlert} onCloseAlert={handleAlertClose} />
    </div>
  );
}
