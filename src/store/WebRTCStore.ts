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
	deleteParticipantsMediaOptions: (userId) =>
		set((state) => {
			const newMap = new Map(state.participantsMediaOptions);
			newMap.delete(userId);
			return { participantsMediaOptions: newMap };
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
	isScreenShare: false,
	participantsHandUp: new Map(),
	participantsMediaOptions: new Map(),
	participantsMediaStream: new Map(),

	participantsUserData: new Map(),
	screenOwnerId: null,
	screenSharingMediaStream: null,
	setIsScreenShare: (value) => set({ isScreenShare: value }),
	setParticipantsHandUp: (map) => set({ participantsHandUp: map }),
	setParticipantsMediaOptions: (map) => set({ participantsMediaOptions: map }),
	setParticipantsMediaStream: (map) => set({ participantsMediaStream: map }),

	setParticipantsUserData: (map) => set({ participantsUserData: map }),

	setScreenOwnerId: (id) => set({ screenOwnerId: id }),

	setScreenSharingMediaStream: (stream) => set({ screenSharingMediaStream: stream }),

	updateParticipantsHandUp: (userId, value) =>
		set((state) => {
			const newMap = new Map(state.participantsHandUp);
			newMap.set(userId, value);
			return { participantsHandUp: newMap };
		}),

	updateParticipantsMediaOptions: (userId, option) =>
		set((state) => {
			const newMap = new Map(state.participantsMediaOptions);
			newMap.set(userId, option);
			return { participantsMediaOptions: newMap };
		}),

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
}));
