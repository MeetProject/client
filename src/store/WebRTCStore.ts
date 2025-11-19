import { create } from 'zustand';
import { ParticipantDataType } from '@/type/signalType';
import { DeviceEnableType } from '@/type/streamType';

interface WebRTCState {
  isScreenShare: boolean;
  participantsMediaStream: Map<string, MediaStream>;
  screenSharingMediaStream: MediaStream | null;
  participantsUserData: Map<string, ParticipantDataType>;
  screenOwnerId: string | null;
  participantsMediaOptions: Map<string, DeviceEnableType>;
  participantsHandUp: Map<string, boolean>;

  setIsScreenShare: (value: boolean) => void;
  setParticipantsMediaStream: (map: Map<string, MediaStream>) => void;
  setScreenSharingMediaStream: (stream: MediaStream | null) => void;
  setParticipantsUserData: (map: Map<string, ParticipantDataType>) => void;
  setScreenOwnerId: (id: string | null) => void;
  setParticipantsMediaOptions: (map: Map<string, DeviceEnableType>) => void;
  setParticipantsHandUp: (map: Map<string, boolean>) => void;

  updateParticipantsMediaStream: (userId: string, stream: MediaStream) => void;
  updateParticipantsUserData: (userId: string, data: ParticipantDataType) => void;
  updateParticipantsMediaOptions: (userId: string, option: DeviceEnableType) => void;

  updateParticipantsHandUp: (userId: string, value: boolean) => void;

  deleteParticipantsMediaStream: (userId: string) => void;
  deleteParticipantsUserData: (userId: string) => void;
  deleteParticipantsMediaOptions: (userId: string) => void;
}

export const useWebRTCStore = create<WebRTCState>((set) => ({
  isScreenShare: false,
  participantsMediaStream: new Map(),
  screenSharingMediaStream: null,
  participantsUserData: new Map(),
  screenOwnerId: null,
  participantsMediaOptions: new Map(),
  participantsHandUp: new Map(),

  setIsScreenShare: (value) => set({ isScreenShare: value }),
  setParticipantsMediaStream: (map) => set({ participantsMediaStream: map }),
  setScreenSharingMediaStream: (stream) => set({ screenSharingMediaStream: stream }),
  setParticipantsUserData: (map) => set({ participantsUserData: map }),
  setScreenOwnerId: (id) => set({ screenOwnerId: id }),
  setParticipantsMediaOptions: (map) => set({ participantsMediaOptions: map }),
  setParticipantsHandUp: (map) => set({ participantsHandUp: map }),

  updateParticipantsMediaStream: (userId, stream) =>
    set((state) => {
      const newMap = new Map(state.participantsMediaStream);
      newMap.set(userId, stream);
      return { participantsMediaStream: newMap };
    }),

  updateParticipantsUserData: (userId, data) =>
    set((state) => {
      const newMap = new Map(state.participantsUserData);
      newMap.set(userId, data);
      return { participantsUserData: newMap };
    }),

  updateParticipantsMediaOptions: (userId, option) =>
    set((state) => {
      const newMap = new Map(state.participantsMediaOptions);
      newMap.set(userId, option);
      return { participantsMediaOptions: newMap };
    }),

  updateParticipantsHandUp: (userId, value) =>
    set((state) => {
      const newMap = new Map(state.participantsHandUp);
      newMap.set(userId, value);
      return { participantsHandUp: newMap };
    }),

  deleteParticipantsMediaStream: (userId) =>
    set((state) => {
      const newMap = new Map(state.participantsMediaStream);
      newMap.delete(userId);
      return { participantsMediaStream: newMap };
    }),

  deleteParticipantsUserData: (userId) =>
    set((state) => {
      const newMap = new Map(state.participantsUserData);
      newMap.delete(userId);
      return { participantsUserData: newMap };
    }),

  deleteParticipantsMediaOptions: (userId) =>
    set((state) => {
      const newMap = new Map(state.participantsMediaOptions);
      newMap.delete(userId);
      return { participantsMediaOptions: newMap };
    }),
}));
