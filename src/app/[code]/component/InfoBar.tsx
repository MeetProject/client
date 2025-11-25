'use client';

import { ReactNode, useState } from 'react';

import * as Icon from '@/asset/icon';
import { useOutsideClick } from '@/hook';
import { PanelType } from '@/type/panelType';

import { IconButton } from './part/InfoBar';

interface ButtonType {
  type: PanelType;
  icon: ReactNode;
  clickedIcon: ReactNode;
  name: string;
  align?: 'right';
}

const ICON_OFF_PROPS = {
  fill: '#ffffff',
  height: 24,
  width: 24,
};

const ICON_ON_PROPS = {
  fill: '#A8C7FA',
  height: 24,
  width: 24,
};

const BUTTON_LIST: ButtonType[] = [
  {
    clickedIcon: <Icon.InfoOn {...ICON_ON_PROPS} />,
    icon: <Icon.InfoOff {...ICON_OFF_PROPS} />,
    name: '회의 세부정보',
    type: 'INFO',
  },
  {
    clickedIcon: <Icon.UserOn {...ICON_ON_PROPS} />,
    icon: <Icon.UserOff {...ICON_OFF_PROPS} />,
    name: '사용자',
    type: 'USER',
  },
  {
    clickedIcon: <Icon.ChatOn {...ICON_ON_PROPS} />,
    icon: <Icon.ChatOff {...ICON_OFF_PROPS} />,
    name: '모든 사용자와 채팅',
    type: 'CHAT',
  },
  /* {
    type: 'ACTIVE',
    icon: <Icon.ActiveOff {...ICON_OFF_PROPS} />,
    clickedIcon: <Icon.ActiveOn {...ICON_ON_PROPS} />,
    name: '활동',
  },
  {
    type: 'HOST',
    icon: <Icon.HostCtrlOff {...ICON_OFF_PROPS} />,
    clickedIcon: <Icon.HostCtrlOn {...ICON_ON_PROPS} />,
    name: '호스트 제어 기능',
    align: 'right',
  }, */
];

export default function InfoBar() {
  const [isClicked, setIsClicked] = useState(false);
  const { targetRef } = useOutsideClick<HTMLDivElement>(() => setIsClicked(false));
  const handleClickButton = () => {
    setIsClicked((previous) => !previous);
  };
  return (
    <>
      <div className='flex items-center justify-end md:hidden'>
        {BUTTON_LIST.map((button, index) => (
          <IconButton key={button.type} align={index === BUTTON_LIST.length - 1 ? 'right' : 'center'} {...button} />
        ))}
      </div>
      <div className='relative right-4 hidden size-12 justify-self-end md:block' ref={targetRef}>
        <button
          type='button'
          onClick={handleClickButton}
          className='flex size-12 items-center justify-center rounded-full hover:bg-[#2F3033] active:bg-[#272F3F] '
        >
          <Icon.Chevron width={16} height={16} fill='#E3E3E3' className={`${!isClicked && 'rotate-180'}`} />
        </button>
        {isClicked && (
          <div
            className='absolute -right-6 top-0 z-40 rounded-lg bg-[#202124] p-2'
            style={{
              boxShadow: '0 2px 2px 0 rgba(0,0,0,.14),0 3px 1px -2px rgba(0,0,0,.12),0 1px 5px 0 rgba(0,0,0,.2)',
              transform: 'translateY(calc(-100% - 20px))',
            }}
          >
            {BUTTON_LIST.map((button, index) => (
              <IconButton key={button.type} align={index === BUTTON_LIST.length - 1 ? 'right' : 'center'} {...button} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
