import { StreamType } from '@/type/signalType';

type StatusType = null | 'failed' | 'success' | 'rejected';

export type StreamStatusType = StatusType | 'pending';

export type DeviceEnableType = Record<'audio' | 'video', boolean>;

export type DeviceType = 'audioInput' | 'videoInput' | 'audioOutput';

export interface TrackInfoType {
	userId: string;
	streamType: StreamType;
}

export interface PendingTrackType {
	streamType?: StreamType;
	track?: MediaStreamTrack;
	userId?: string;
}

export interface StreamTrackType {
	stream: MediaStream;
	audio: boolean;
	video: boolean;
}

export type TrackType = 'audio' | 'video' | 'screenAudio' | 'screenVideo';
