import { create } from 'zustand';

import { PendingTrackType } from '@/type/streamType';

interface PendingTrackState {
	pendingTrack: Map<string, PendingTrackType>;

	setPendingTrack: (trackId: string, value: Partial<PendingTrackType>) => void;
	deletePendingTrack: (trackId: string) => void;
}

export const usePendingTrackStore = create<PendingTrackState>((set) => ({
	deletePendingTrack: (trackId) =>
		set((state) => {
			const newMap = new Map(state.pendingTrack);
			newMap.delete(trackId);
			return { pendingTrack: newMap };
		}),

	pendingTrack: new Map(),

	setPendingTrack: (trackId, value) =>
		set((state) => {
			const newMap = new Map(state.pendingTrack);
			const prev = state.pendingTrack.get(trackId) ?? {};
			newMap.set(trackId, { ...prev, ...value });
			return { pendingTrack: newMap };
		}),
}));
