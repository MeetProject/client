import { create } from 'zustand';

import { PendingTrackType, TrackInfoType } from '@/type/streamType';

interface PendingTrackState {
	senderTrack: Map<string, TrackInfoType>; //key: trackId

	pendingTrack: Map<string, PendingTrackType>; //key: mid

	setPendingTrack: (mid: string, value: PendingTrackType) => void;
	deletePendingTrack: (mid: string) => void;

	addSenderTrack: (trackId: string, trackInfo: TrackInfoType) => void;
	clearSenderTrack: () => void;
}

export const usePendingTrackStore = create<PendingTrackState>((set) => ({
	addSenderTrack: (trackId, trackInfo) =>
		set((state) => {
			const newMap = new Map(state.senderTrack);
			newMap.set(trackId, trackInfo);
			return { senderTrack: newMap };
		}),

	clearSenderTrack: () => set(() => ({ senderTrack: new Map() })),

	deletePendingTrack: (mid) =>
		set((state) => {
			const newMap = new Map(state.pendingTrack);
			newMap.delete(mid);
			return { pendingTrack: newMap };
		}),
	pendingTrack: new Map(),

	senderTrack: new Map(),
	setPendingTrack: (mid, value) =>
		set((state) => {
			const newMap = new Map(state.pendingTrack);
			newMap.set(mid, value);
			return { pendingTrack: newMap };
		}),
}));
