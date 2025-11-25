'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import * as Icon from '@/asset/icon';
import { Feedback, Setting } from '@/component';
import { useOutsideClick } from '@/hook';
import { useUserInfoStore } from '@/store/UserInfoStore';

import { CurrentDate, IconButton } from './part/Header';

const ICON_PROPS = {
  fill: '#5f6368',
  height: 24,
  width: 24,
};

const HELP_BUTTON = [
  { href: 'https://github.com/armd482/meetproejct', name: '도움말' },
  { href: 'https://github.com/armd482/meetproejct', name: '교육' },
  { href: 'https://github.com/armd482/meetproejct', name: '서비스 약관' },
  { href: 'https://github.com/armd482/meetproejct', name: '개인정보처리방침' },
  { href: 'https://github.com/armd482/meetproejct', name: '약관 요약' },
];

export default function Header() {
  const { color, name, setColor, setId, setName } = useUserInfoStore(
    useShallow((state) => ({
      color: state.color,
      name: state.name,
      setColor: state.setColor,
      setId: state.setId,
      setName: state.setName,
    })),
  );

  const [isClickedSetting, setIsClickedSetting] = useState(false);
  const [isClickedName, setIsClickedName] = useState(false);
  const [isClickedFeedback, setIsClickedFeedback] = useState(false);
  const [isClickedHelp, setIsClickedHelp] = useState(false);

  const handleCloseInfo = () => {
    setIsClickedName(false);
  };

  const handleLogout = () => {
    setName('');
    setColor('');
    setId('');
    setIsClickedName(false);
  };

  const handleHelpClose = () => {
    setIsClickedHelp(false);
  };

  const { targetRef } = useOutsideClick<HTMLDivElement>(handleCloseInfo);
  const { targetRef: helpReference } = useOutsideClick<HTMLDivElement>(handleHelpClose);

  const handleSettingClick = () => {
    setIsClickedSetting((previous) => !previous);
  };

  const handleSettingClose = () => {
    setIsClickedSetting(false);
  };

  const handleFeedbackClick = () => {
    setIsClickedFeedback(true);
  };

  const handleFeedbackClose = () => {
    setIsClickedFeedback(false);
  };

  const handleHelpClick = () => {
    setIsClickedHelp((previous) => !previous);
  };

  const handleHelpButtonClick = (href: string) => {
    window.open(href, '_blank');
    setIsClickedHelp(false);
  };

  const BUTTON_LIST = [
    {
      icon: <Icon.Help {...ICON_PROPS} />,
      name: '지원',
      onClick: handleHelpClick,
    },
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

        {BUTTON_LIST.map((button) => (
          <IconButton key={button.name} name={button.name} onClick={button.onClick}>
            {button.icon}
          </IconButton>
        ))}

        {isClickedHelp && (
          <div
            ref={helpReference}
            className={`absolute top-12 ${name && color ? 'right-[155px]' : 'right-[100px]'} z-[5] w-[280px] rounded bg-white py-2`}
            style={{
              boxShadow: '0 3px 5px -1px rgba(0,0,0,.2),0 6px 10px 0 rgba(0,0,0,.14),0 1px 18px 0 rgba(0,0,0,.12)',
            }}
          >
            {HELP_BUTTON.map((button) => (
              <button
                key={button.name}
                type='button'
                onClick={() => handleHelpButtonClick(button.href)}
                className='flex h-12 w-full items-center justify-center px-4 text-black hover:bg-[#F5F5F5] active:bg-[#D7D7D7]'
              >
                {button.name}
              </button>
            ))}
          </div>
        )}
        {name && color && (
          <div className='relative'>
            <button
              type='button'
              className='mx-3 flex size-8 items-center justify-end truncate rounded-full font-bold text-white'
              style={{ backgroundColor: color }}
              onClick={() => setIsClickedName((previous) => !previous)}
            >
              {name}
            </button>
            {isClickedName && (
              <div
                ref={targetRef}
                className='absolute right-0 top-full flex w-[412px] -translate-x-3 translate-y-2 flex-col items-center gap-3  rounded-3xl bg-[#E9EEF6] p-4'
                style={{ boxShadow: '0 4px 8px 3px rgba(0, 0, 0, 0.15),0 1px 3px rgba(0, 0, 0, 0.3)' }}
              >
                <button
                  type='button'
                  onClick={handleCloseInfo}
                  className='absolute right-2 top-2 flex size-12 items-center justify-center'
                >
                  <Icon.Delete width={24} height={24} fill='#444746' />
                </button>

                <div className='mx-14 my-2 mb-4 truncate text-center text-sm font-medium'>{name}</div>
                <div
                  className='flex size-[104px] items-center justify-center overflow-hidden rounded-full text-3xl font-bold text-white'
                  style={{ backgroundColor: color }}
                >
                  {name.slice(0, 3)}
                </div>
                <div className='text-wrap text-center text-2xl font-medium'>안녕하세요, {name}님.</div>
                <button
                  type='button'
                  onClick={handleLogout}
                  className='mt-2 flex w-full items-center justify-center gap-3 rounded-full bg-[#F8FAFD] py-4 text-lg text-custom-gray'
                >
                  <Icon.Logout width={18} height={18} fill='#444746' />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <Setting isOpen={isClickedSetting} onClose={handleSettingClose} />
      <Feedback isOpen={isClickedFeedback} onClose={handleFeedbackClose} />
    </div>
  );
}
