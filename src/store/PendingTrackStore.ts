import { create } from 'zustand';

import { PendingTrackType, TrackType } from '@/type/streamType';

interface PendingTrackState {
	transceiver: Record<TrackType, RTCRtpTransceiver | null>;
	pendingTrack: Map<string, PendingTrackType>;

	setTransceiver: (type: TrackType, t: RTCRtpTransceiver | null) => void;
	clearTransceiver: () => void;

	setPendingTrack: (mid: string, value: Partial<PendingTrackType>) => void;
	deletePendingTrack: (mid: string) => void;
}

export const usePendingTrackStore = create<PendingTrackState>((set) => ({
	clearTransceiver: () =>
		set(() => ({
			transceiver: {
				audio: null,
				screenAudio: null,
				screenVideo: null,
				video: null,
			},
		})),

	deletePendingTrack: (mid) =>
		set((state) => {
			const newMap = new Map(state.pendingTrack);
			newMap.delete(mid);
			return { pendingTrack: newMap };
		}),

	pendingTrack: new Map(),
	setPendingTrack: (mid, value) =>
		set((state) => {
			const newMap = new Map(state.pendingTrack);
			const prev = state.pendingTrack.get(mid) ?? {};
			newMap.set(mid, { ...prev, ...value });
			return { pendingTrack: newMap };
		}),

	setTransceiver: (type: TrackType, t: RTCRtpTransceiver) =>
		set((state) => {
			const prev = state.transceiver;
			return { transceiver: { ...prev, [type]: t } };
		}),

	transceiver: {
		audio: null,
		screenAudio: null,
		screenVideo: null,
		video: null,
	},
}));
