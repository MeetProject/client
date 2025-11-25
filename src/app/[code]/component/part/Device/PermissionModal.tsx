'use client';

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Modal, InitialRequestModal, RequestModal } from '@/component';
import { useDeviceStore } from '@/store/DeviceStore';

import { NotificationModal, RequestInfoModal } from './PermissionModal/index';


interface PermissionModalProperties {
  isOpenModal: boolean;
  onClose: () => void;
}

type ModalContentProperties = Omit<PermissionModalProperties, 'isOpenModal'>;

function ModalContent({ onClose }: ModalContentProperties) {
  const [isDenied, setIsDenied] = useState(false);

  const { permission: devicePermission, streamStatus } = useDeviceStore(
    useShallow((state) => ({
      permission: state.permission,
      streamStatus: state.streamStatus,
    })),
  );

  const handleRequseError = () => {
    setIsDenied(true);
  };

  if (!devicePermission) {
    return <InitialRequestModal />;
  }

  if (streamStatus === 'failed') {
    return <NotificationModal onClose={onClose} />;
  }

  if (!isDenied) {
    <RequestModal onSkipUpdateStream={onClose} onRequstError={handleRequseError} />;
  }

  return <RequestInfoModal onClose={onClose} />;
}

export default function PermissionModal({ isOpenModal, onClose }: PermissionModalProperties) {
  const [isTimeOut, setIsTimeOut] = useState(false);

  const { permission: devicePermission } = useDeviceStore(
    useShallow((state) => ({
      permission: state.permission,
    })),
  );

  const handleOutsideModalClick = () => {
    if (devicePermission) {
      onClose();
    }
  };

  useEffect(() => {
    if (devicePermission) {
      return;
    }
    const timer = setTimeout(() => {
      if (!devicePermission) {
        setIsTimeOut(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [devicePermission]);

  return (
    <Modal isOpen={isOpenModal || (!devicePermission && isTimeOut)} onCloseModal={handleOutsideModalClick}>
      <ModalContent onClose={onClose} />
    </Modal>
  );
}
