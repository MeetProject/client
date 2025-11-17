'use client';

import { useEffect, useState } from 'react';
import { Modal, InitialRequestModal, RequestModal } from '@/component';

import { useDeviceStore } from '@/store/DeviceStore';
import { useShallow } from 'zustand/react/shallow';

import { NotificationModal, RequestInfoModal } from './PermissionModal/index';

interface PermissionModalProps {
  isOpenModal: boolean;
  onClose: () => void;
  onUpdateStream: () => void;
}

type ModalContentProps = Omit<PermissionModalProps, 'isOpenModal'>;

function ModalContent({ onClose, onUpdateStream }: ModalContentProps) {
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
    return <NotificationModal onClose={onClose} onUpdateStream={onUpdateStream} />;
  }

  if (!isDenied) {
    <RequestModal onSkipUpdateStream={onClose} onRequstError={handleRequseError} onUpdateStream={onUpdateStream} />;
  }

  return <RequestInfoModal onClose={onClose} />;
}

export default function PermissionModal({ isOpenModal, onClose, onUpdateStream }: PermissionModalProps) {
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
      <ModalContent onClose={onClose} onUpdateStream={onUpdateStream} />
    </Modal>
  );
}
