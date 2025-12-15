import { StreamType } from '@/type/signalType';

export const getTrackType = (streamType: StreamType, trackKind: string) => {
	if (streamType === 'USER') {
		if (trackKind === 'audio') {
			return 'audio';
		}
		return 'video';
	}

	if (trackKind === 'audio') {
		return 'screenAudio';
	}
	return 'screenVideo';
};
