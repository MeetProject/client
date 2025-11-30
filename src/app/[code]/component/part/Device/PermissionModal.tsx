'use client';

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { NotificationModal, RequestInfoModal } from './PermissionModal/index';

import { Modal, InitialRequestModal, RequestModal } from '@/component';
import { useDeviceStore } from '@/store/DeviceStore';

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
		<RequestModal onRequstError={handleRequseError} onSkipUpdateStream={onClose} />;
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
		return () => {
			clearTimeout(timer);
		};
	}, [devicePermission]);

	return (
		<Modal isOpen={isOpenModal || (!devicePermission && isTimeOut)} onCloseModal={handleOutsideModalClick}>
			<ModalContent onClose={onClose} />
		</Modal>
	);
}
