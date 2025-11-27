'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { checkPermissionOnchange } from '@/lib/checkBrowser';
import { getCurrentDeviceInfo } from '@/lib/getCurrentDeviceInfo';
import { getStreamConstraint } from '@/lib/getStreamConstraint';
import { addPermissionListener } from '@/lib/mediaPermission';
import { useDeviceStore } from '@/store/DeviceStore';
import { DeviceType } from '@/type/streamType';

const useDevice = () => {
	const timerReference = useRef<NodeJS.Timeout | null>(null);

	const { deviceStream } = useDeviceStore(
		useShallow((state) => ({
			deviceStream: state.stream,
			enable: state.deviceEnable,
		})),
	);

	const stopStream = useCallback(() => {
		const { setStream, setStreamStatus, stream } = useDeviceStore.getState();
		if (!stream) {
			return;
		}

		setStreamStatus(null);
		stream.getTracks().forEach((device) => device.stop());
		setStream(null);
	}, []);

	const stopScreenStream = useCallback(() => {
		const { screenStream, setScreenStream } = useDeviceStore.getState();
		if (!screenStream) {
			return screenStream;
		}
		screenStream.getTracks().forEach((track) => track.stop());
		setScreenStream(null);
	}, []);

	const updateDeviceStatus = useCallback(async (mediaStream: MediaStream) => {
		const deviceInfo = await getCurrentDeviceInfo(mediaStream);

		const {
			audioOutput,
			setAudioInput,
			setAudioInputList,
			setAudioOutput,
			setAudioOutputList,
			setVideoInput,
			setVideoInputList,
		} = useDeviceStore.getState();

		setAudioInputList(deviceInfo.currentAudioInputList);
		setAudioOutputList(deviceInfo.currentAudioOutputList);
		setVideoInputList(deviceInfo.currentVideoInputList);

		setAudioInput(deviceInfo.currentAudioInput);
		if (!audioOutput) {
			setAudioOutput(deviceInfo.currentAudioOutput);
		}
		setVideoInput(deviceInfo.currentVideoInput);

		return deviceInfo;
	}, []);

	const checkPermission = useCallback(async () => {
		const { setPermission } = useDeviceStore.getState();
		if (!navigator.permissions) {
			return false;
		}

		try {
			const videoPermission = await navigator.permissions.query({
				name: 'camera' as PermissionName,
			});
			const audioPermission = await navigator.permissions.query({
				name: 'microphone' as PermissionName,
			});

			if (audioPermission.state === 'prompt' || videoPermission.state === 'prompt') {
				return false;
			}

			const newPermission = {
				audio: Boolean(audioPermission.state === 'granted'),
				isFailed: false,
				video: Boolean(videoPermission.state === 'granted'),
			};
			setPermission(newPermission);
			return newPermission;
		} catch {
			return false;
		}
	}, []);

	const getStream = useCallback(async (audio: boolean | string, video: boolean | string) => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: typeof audio === 'string' ? { deviceId: { exact: audio } } : audio,
				video: typeof video === 'string' ? { deviceId: { exact: video } } : video,
			});

			return stream;
		} catch (e) {
			const error = e as DOMException;
			if (error.name === 'NotAllowdError') {
				return false;
			}
			return 'failed';
		}
	}, []);

	const getUnsupprtedPermissionStream = useCallback(
		async (audio?: string, video?: string) => {
			const { setPermission } = useDeviceStore.getState();
			const ATVT = await getStream(audio ?? true, video ?? true);

			if (ATVT !== 'failed') {
				setPermission({ audio: true, video: true });
				return ATVT;
			}

			const ATVF = await getStream(audio ?? true, video ?? false);
			if (ATVF !== 'failed') {
				setPermission({ audio: true, video: false });
				return ATVF;
			}

			const AFVT = await getStream(audio ?? false, video ?? true);
			if (AFVT !== 'failed') {
				setPermission({ audio: false, video: true });
				return AFVT;
			}

			setPermission({ audio: false, video: false });
			return false;
		},
		[getStream],
	);

	const updateStream = useCallback(async () => {
		const { audioInput, deviceEnable, setDeviceEnable, setStream, setStreamStatus, videoInput } =
			useDeviceStore.getState();
		stopStream();
		setStreamStatus('pending');

		const isPermissionUpdate = await checkPermission();
		try {
			const constraints = isPermissionUpdate
				? getStreamConstraint(isPermissionUpdate, { audio: audioInput?.deviceId, video: videoInput?.deviceId })
				: undefined;
			const newStream = isPermissionUpdate
				? await navigator.mediaDevices.getUserMedia(constraints)
				: await getUnsupprtedPermissionStream(audioInput?.deviceId, videoInput?.deviceId);

			if (!newStream) {
				throw new Error('권한 없음');
			}

			if (!deviceEnable.audio) {
				newStream.getAudioTracks().forEach((track) => {
					track.enabled = false;
				});
			}

			if (!deviceEnable.video) {
				newStream.getVideoTracks().forEach((track) => {
					track.stop();
				});
			}

			updateDeviceStatus(newStream);
			setStream(newStream);
			setStreamStatus('success');
			return newStream;
		} catch {
			setStreamStatus('rejected');
			setStream(null);
			setDeviceEnable({ audio: false, video: false });
			return null;
		}
	}, [stopStream, checkPermission, getUnsupprtedPermissionStream, updateDeviceStatus]);

	const updateScreenStream = useCallback(async (audio: boolean) => {
		const { setScreenStream } = useDeviceStore.getState();
		try {
			const mediaStream = await navigator.mediaDevices.getDisplayMedia({ audio });
			setScreenStream(mediaStream);
			return mediaStream;
		} catch {
			throw new Error('화면 공유 스트림 가져오기 실패');
		}
	}, []);

	const toggleAudioInput = useCallback(async () => {
		const { audioInputList, deviceEnable, setDeviceEnable, stream } = useDeviceStore.getState();
		if (stream && audioInputList.length !== 0) {
			setDeviceEnable(() => {
				const newValue = !deviceEnable.audio;
				stream.getAudioTracks().forEach((track) => {
					track.enabled = newValue;
				});
				return { ...deviceEnable, audio: newValue };
			});
		}
	}, []);

	const toggleVideoInput = useCallback(async () => {
		const { deviceEnable, setDeviceEnable, stream } = useDeviceStore.getState();
		if (!stream) {
			return;
		}

		setDeviceEnable((previous) => ({ ...previous, video: !previous.video }));
		if (deviceEnable.video) {
			stream.getVideoTracks().forEach((track) => {
				track.stop();
			});
		} else {
			updateStream();
		}
	}, [updateStream]);

	const changeTrack = useCallback(
		async (device: MediaDeviceInfo, type: DeviceType) => {
			const { setAudioInput, setAudioOutput, setVideoInput, stream } = useDeviceStore.getState();
			if (!stream) {
				return;
			}

			if (type === 'audioOutput') {
				setAudioOutput(device);
				return;
			}
			if (type === 'audioInput') {
				setAudioInput(device);
			} else {
				setVideoInput(device);
			}
			updateStream();
		},
		[updateStream],
	);

	return {
		addPermissionListener,
    changeTrack,
    checkPermissionOnchange,
		stopScreenStream,
		stopStream,
    toggleAudioInput,
		toggleVideoInput,
		updateDeviceStatus,
		updateScreenStream,
		updateStream,
	};
};

export default useDevice;
