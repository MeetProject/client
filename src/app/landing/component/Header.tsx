'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import * as Icon from '@/asset/icon';
import { Feedback, Setting } from '@/component';
import { useClientStore } from '@/store/ClientStore';

import { CurrentDate, HelpMenu, IconButton, InfoMenu } from './part/Header';

const ICON_PROPS = {
  fill: '#5f6368',
  height: 24,
  width: 24,
};


type Menu = 'feedback' | 'setting'

export default function Header() {
  const { client } = useClientStore(
    useShallow((state) => ({
      client: state.client
    })),
  );

  const [menuStatus, setMenuStatus] = useState<Record<Menu, boolean>>({
    feedback: false,
    setting: false,
  })


  const toggleMenu = (menu: Menu) => {
    setMenuStatus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  }
    

  const closeMenu = (menu: Menu) => {
    setMenuStatus((prev) => ({ ...prev, [menu]: false }));
  }

  const handleSettingClick = () => {
    toggleMenu('setting');
  };

  const handleSettingClose = () => {
    closeMenu('setting')
  };

  const handleFeedbackClick = () => {
    toggleMenu('feedback');
  };

  const handleFeedbackClose = () => {
    closeMenu('feedback');
  };

  const BUTTON_LIST = [
    {
      icon: <Icon.Feedback {...ICON_PROPS} />,
      name: '문제 신고',
      onClick: handleFeedbackClick,
    },
    {
      icon: <Icon.Setting {...ICON_PROPS} />,
      name: '설정',
      onClick: handleSettingClick,
    },
  ];

  return (
    <div className='relative h-16'>
      <Link
        href='/'
        className='absolute left-5 top-1/2 flex h-10 -translate-y-1/2 items-center gap-2 whitespace-nowrap'
      >
        <Icon.Logo width={36} height={36} />
        <p className='text-1.5xl font-semibold text-gray-600 sm:hidden'>Project</p>
        <p className='text-1.5xl font-medium text-gray-600 sm:hidden'>Meet</p>
      </Link>
      <div className='absolute right-5 top-1/2 z-10 flex -translate-y-1/2 items-center whitespace-nowrap bg-white'>
        <div className='sm:hidden'>
          <CurrentDate />
        </div>
        <HelpMenu/>

        {BUTTON_LIST.map((button) => (
          <IconButton key={button.name} name={button.name} onClick={button.onClick}>
            {button.icon}
          </IconButton>
        ))}
        {client && (
          <InfoMenu/>
        )}
      </div>
      <Setting isOpen={menuStatus.setting} onClose={handleSettingClose} />
      <Feedback isOpen={menuStatus.feedback} onClose={handleFeedbackClose} />
    </div>
  );
}
