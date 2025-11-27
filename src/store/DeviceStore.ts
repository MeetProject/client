import { create } from 'zustand';

import { StreamStatusType, DeviceEnableType } from '@/type/streamType';

type DeviceCallback = (deviceEnable: DeviceEnableType) => Record<'video' | 'audio', boolean>;

interface DeviceStoreType {
	stream: MediaStream | null;
	streamStatus: StreamStatusType;
	screenStream: MediaStream | null;
	permission: null | DeviceEnableType;
	audioInput: MediaDeviceInfo | null;
	audioOutput: MediaDeviceInfo | null;
	videoInput: MediaDeviceInfo | null;
	deviceEnable: DeviceEnableType;
	audioInputList: MediaDeviceInfo[];
	audioOuputList: MediaDeviceInfo[];
	videoInputList: MediaDeviceInfo[];
	setStream: (value: MediaStream | null) => void;
	setStreamStatus: (value: StreamStatusType) => void;
	setScreenStream: (value: MediaStream | null) => void;
	setPermission: (callback: Record<'audio' | 'video', boolean> | null | DeviceCallback) => void;
	setAudioInput: (value: MediaDeviceInfo | null) => void;
	setAudioOutput: (value: MediaDeviceInfo | null) => void;
	setVideoInput: (value: MediaDeviceInfo | null) => void;
	setDeviceEnable: (callback: DeviceEnableType | DeviceCallback) => void;
	setAudioInputList: (value: MediaDeviceInfo[]) => void;
	setAudioOutputList: (value: MediaDeviceInfo[]) => void;
	setVideoInputList: (value: MediaDeviceInfo[]) => void;
}

export const useDeviceStore = create<DeviceStoreType>((set) => ({
	audioInput: null,
	audioInputList: [],
	audioOuputList: [],
	audioOutput: null,
	deviceEnable: { audio: true, video: true },
	permission: null,
	screenStream: null,
	setAudioInput: (value: MediaDeviceInfo | null) => set(() => ({ audioInput: value })),
	setAudioInputList: (value: MediaDeviceInfo[]) => set(() => ({ audioInputList: value })),
	setAudioOutput: (value: MediaDeviceInfo | null) => set(() => ({ audioOutput: value })),
	setAudioOutputList: (value: MediaDeviceInfo[]) => set(() => ({ audioOuputList: value })),
	setDeviceEnable: (callback: DeviceEnableType | DeviceCallback) =>
		set((state) => {
			if (typeof callback === 'function') {
				return { deviceEnable: callback(state.deviceEnable) };
			}
			return { deviceEnable: callback };
		}),
	setPermission: (callback: Record<'audio' | 'video', boolean> | null | DeviceCallback) =>
		set((state) => {
			if (typeof callback === 'function') {
				return { permission: callback(state.permission ?? { audio: false, video: false }) };
			}
			return { permission: callback };
		}),
	setScreenStream: (value: MediaStream | null) => set(() => ({ screenStream: value })),
	setStream: (value: MediaStream | null) => set(() => ({ stream: value })),
	setStreamStatus: (value: StreamStatusType) => set(() => ({ streamStatus: value })),
	setVideoInput: (value: MediaDeviceInfo | null) => set(() => ({ videoInput: value })),
	setVideoInputList: (value: MediaDeviceInfo[]) => set(() => ({ videoInputList: value })),
	stream: null,
	streamStatus: null,
	videoInput: null,
	videoInputList: [],
}));
