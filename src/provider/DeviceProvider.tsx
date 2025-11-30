'use client';

import { PropsWithChildren, useEffect, useRef } from 'react';

import { useDevice } from '@/hook';
import { useDeviceStore } from '@/store/DeviceStore';

export default function DeviceProvider({ children }: PropsWithChildren) {
	const { stream } = useDeviceStore();
	const { addPermissionListener, checkPermissionOnchange, stopStream, updateDeviceStatus, updateStream } = useDevice();

	const timerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const handleDeviceChange = async () => {
			if (!stream) {
				return;
			}
			await updateDeviceStatus(stream);
		};

		navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

		return () => {
			navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
		};
	}, [stream, updateDeviceStatus]);

	useEffect(() => {
		if (!stream) {
			return;
		}
		const checkDevicePermission = async () => {
			const isEnableCheckPermission = await checkPermissionOnchange('microphone');
			if (isEnableCheckPermission) {
				await addPermissionListener(async () => {
					stopStream();
					await updateStream();
				});
			} else {
				timerRef.current = setInterval(async () => {
					const tracks = stream.getTracks();
					const isDeny = tracks.some((track) => track.muted);
					if (isDeny) {
						stopStream();
						await updateStream();
					}
				}, 1000);
			}
		};

		checkDevicePermission();
		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [stream, updateStream, stopStream, checkPermissionOnchange, addPermissionListener]);

	useEffect(() => {
		if (!stream) {
			return;
		}

		const checkLiveState = () => {
			const live = stream.getTracks().some((track) => track.readyState === 'live');
			if (!live) {
				updateStream();
			}
		};

		stream.getTracks().forEach((track) => {
			track.addEventListener('ended', checkLiveState);
		});

		checkLiveState();

		return () => {
			stream.getTracks().forEach((track) => {
				track.removeEventListener('ended', checkLiveState);
			});
		};
	}, [stream, updateStream]);
	return children;
}
