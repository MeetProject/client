type StatusType = null | 'failed' | 'success' | 'rejected';

export type StreamStatusType = StatusType | 'pending';
export type DeviceType = Record<'id' | 'name', string>;

export type DeviceEnableType = Record<'audio' | 'video', boolean>;
