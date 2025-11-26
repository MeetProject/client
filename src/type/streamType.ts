type StatusType = null | 'failed' | 'success' | 'rejected';

export type StreamStatusType = StatusType | 'pending';

export type DeviceEnableType = Record<'audio' | 'video', boolean>;

export type DeviceType = 'audioInput' | 'videoInput' | 'audioOutput';
