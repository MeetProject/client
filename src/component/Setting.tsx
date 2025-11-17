import { useState } from 'react';
import * as Icon from '@/asset/icon';
import { useDeviceStore } from '@/store/DeviceStore';
import { useShallow } from 'zustand/react/shallow';
import Modal from './Modal';
import RequestModal from './RequestModal';
import InitialRequestModal from './InitialRequestModal';
import { AudioSetting, VideoSetting } from './part/Setting';

interface SettingProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingModalProps {
  onClose: () => void;
}

interface SettingContentProps {
  category: Category;
}

type Category = 'audio' | 'video' | 'general';

interface CategoryButtonType {
  name: string;
  value: Category;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const CATEGORY_BUTTON: CategoryButtonType[] = [
  {
    name: '오디오',
    value: 'audio',
    icon: Icon.Speaker,
  },
  {
    name: '비디오',
    value: 'video',
    icon: Icon.VideoOn,
  },
];

function SettingContent({ category }: SettingContentProps) {
  if (category === 'audio') {
    return <AudioSetting />;
  }

  return <VideoSetting />;
}

function SettingModal({ onClose }: SettingModalProps) {
  const [category, setCategory] = useState<Category>('audio');
  const handleCategoryButtonClick = (value: Category) => {
    setCategory(value);
  };

  const handleDeleteButtonClick = () => {
    onClose();
  };

  return (
    <div
      className='relative flex h-[650px] w-[800px] overflow-hidden rounded-lg bg-white font-googleSans'
      style={{ maxWidth: 'calc(100vw - 32px)' }}
    >
      <div className='h-full w-[256px] border-r border-solid border-[#DADCE0] md:w-20'>
        <h1 className='px-6 pt-6 text-1.5xl text-[#202124] md:hidden'>설정</h1>
        <div className='mr-2 mt-6'>
          {CATEGORY_BUTTON.map((categoryButton) => {
            const IconComponent = categoryButton.icon;
            return (
              <button
                type='button'
                key={categoryButton.value}
                onClick={() => handleCategoryButtonClick(categoryButton.value)}
                className={`group relative flex h-12 w-full items-center gap-3 rounded-r-full ${category === categoryButton.value ? 'z-10 bg-[#E8F0FE] hover:shadow-md' : 'bg-white hover:bg-[#F9F9F9]'} px-6`}
              >
                <IconComponent
                  width={24}
                  height={24}
                  fill={category === categoryButton.value ? '#1967D2' : '#5F6368'}
                  className={`group-hover:${category === categoryButton.value ? 'fill-[#174FA7]' : 'fill-[#232427]'}`}
                />
                <p
                  className={`${
                    category === categoryButton.value
                      ? 'text-[#1967D2] group-hover:text-[#174EA6]'
                      : 'text-[#5F6368] group-hover:text-[#202124]'
                  } md:hidden`}
                >
                  {categoryButton.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>
      <button
        type='button'
        onClick={handleDeleteButtonClick}
        className='absolute right-3 top-[9px] flex size-12 items-center justify-center rounded-full hover:bg-[#F9F9F9] active:bg-[#E6E7E7]'
      >
        <Icon.Delete width={24} height={24} fill='#5F6368' />
      </button>
      <div className='m-6 pt-[60px] md:w-settingContent-md'>
        <SettingContent category={category} />
      </div>
    </div>
  );
}

export default function Setting({ isOpen, onClose }: SettingProps) {
  const [isTimeOut, setIsTimeOut] = useState(false);
  const [isRenderSetting, setIsRenderSetting] = useState(false);

  const { permission } = useDeviceStore(
    useShallow((state) => ({
      permission: state.permission,
    })),
  );

  const handleSkipUpdateStreamButtonClick = () => {
    setIsRenderSetting(true);
  };

  const handleModalClose = () => {
    if (!isRenderSetting) {
      return;
    }
    setIsRenderSetting(false);
    setIsTimeOut(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen && isTimeOut} onCloseModal={handleModalClose}>
      {
        isRenderSetting &&
          (permission === null ? (
            <InitialRequestModal />
          ) : permission.audio || permission.video ? (
            <SettingModal onClose={handleModalClose} />
          ) : (
            <RequestModal onSkipUpdateStream={handleSkipUpdateStreamButtonClick} />
          )) /* isRequsetStream ? (
        <InitialRequestModal />
      ) : (
        <RequestModal
          onUpdateStream={handleUpdateStreamButtonClick}
          onSkipUpdateStream={handleSkipUpdateStreamButtonClick}
        /> */
      }
    </Modal>
  );
}
