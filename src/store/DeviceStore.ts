import { create } from 'zustand';

import { DeviceType, StreamStatusType } from '@/type/streamType';

type PermissionType = Record<'audio' | 'video', boolean>;
type PermissionCallback = (value: PermissionType) => PermissionType;

type DeviceCallback = (deviceEnable: Record<'video' | 'audio', boolean>) => Record<'video' | 'audio', boolean>;

type DeviceEnable = Record<'video' | 'audio', boolean>;

interface DeviceStoreType {
  stream: MediaStream | null;
  streamStatus: StreamStatusType;
  screenStream: MediaStream | null;
  permission: null | PermissionType;
  audioInput: DeviceType;
  audioOutput: DeviceType;
  videoInput: DeviceType;
  deviceEnable: DeviceEnable;
  audioInputList: MediaDeviceInfo[];
  audioOuputList: MediaDeviceInfo[];
  videoInputList: MediaDeviceInfo[];
  setStream: (value: MediaStream | null) => void;
  setStreamStatus: (value: StreamStatusType) => void;
  setScreenStream: (value: MediaStream | null) => void;
  setPermission: (callback: Record<'audio' | 'video', boolean> | null | PermissionCallback) => void;
  setAudioInput: (value: DeviceType) => void;
  setAudioOutput: (value: DeviceType) => void;
  setVideoInput: (value: DeviceType) => void;
  setDeviceEnable: (callback: DeviceEnable | DeviceCallback) => void;
  setAudioInputList: (value: MediaDeviceInfo[]) => void;
  setAudioOutputList: (value: MediaDeviceInfo[]) => void;
  setVideoInputList: (value: MediaDeviceInfo[]) => void;
}

export const useDeviceStore = create<DeviceStoreType>((set) => ({
  audioInput: { id: '', name: '' },
  audioInputList: [],
  audioOuputList: [],
  audioOutput: { id: '', name: '' },
  deviceEnable: { audio: true, video: true },
  permission: null,
  screenStream: null,
  setAudioInput: (value: Record<'id' | 'name', string>) => set(() => ({ audioInput: value })),
  setAudioInputList: (value: MediaDeviceInfo[]) => set(() => ({ audioInputList: value })),
  setAudioOutput: (value: Record<'id' | 'name', string>) => set(() => ({ audioOutput: value })),
  setAudioOutputList: (value: MediaDeviceInfo[]) => set(() => ({ audioOuputList: value })),
  setDeviceEnable: (callback: DeviceEnable | DeviceCallback) =>
    set((state) => {
      if (typeof callback === 'function') {
        return { deviceEnable: callback(state.deviceEnable) };
      }
      return { deviceEnable: callback };
    }),
  setPermission: (callback: Record<'audio' | 'video', boolean> | null | PermissionCallback) =>
    set((state) => {
      if (typeof callback === 'function') {
        return { permission: callback(state.permission ?? { audio: false, video: false }) };
      }
      return { permission: callback };
    }),
  setScreenStream: (value: MediaStream | null) => set(() => ({ screenStream: value })),
  setStream: (value: MediaStream | null) => set(() => ({ stream: value })),
  setStreamStatus: (value: StreamStatusType) => set(() => ({ streamStatus: value })),
  setVideoInput: (value: Record<'id' | 'name', string>) => set(() => ({ videoInput: value })),
  setVideoInputList: (value: MediaDeviceInfo[]) => set(() => ({ videoInputList: value })),
  stream: null,
  streamStatus: null,
  videoInput: { id: '', name: '' },
  videoInputList: [],
}));
