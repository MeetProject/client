type ResponseType = 'REGISTER' | 'JOIN' | 'ANSWER' | 'OFFER' | 'ICE' | 'LEAVE';
export type StreamType = 'USER' | 'SCREEN';

interface SignalResponseType {
  type: ResponseType;
}

export interface ParticipantDataType {
  userId: string;
  userName: string;
  profieColor: string;
}

export interface RegisterResponseType extends SignalResponseType {
  userId: string;
}

export interface JoinPayloadType {
  roomId: string;
}

export interface JoinResponseType extends SignalResponseType {
  roomId: string;
  participants: ParticipantDataType[];
  screenId: string | null;
}

export interface SdpPayloadType {
  toUserId: string;
  fromUserSDP: string;
  streamType: 'SCREEN' | 'USER';
}

export interface SdpResponseType extends SignalResponseType {
  fromUserId: string;
  fromUserSDP: string;
  streamType: 'SCREEN' | 'USER';
  isScreenSender: boolean;
}

export interface IcePayloadType {
  toUserId: string;
  fromCandidate: string;
  streamType: 'SCREEN' | 'USER';
}

export interface IceResponseType extends SignalResponseType {
  fromUserId: string;
  fromUserIce: string;
  streamType: 'SCREEN' | 'USER';
}

export interface LeavePayloadType {
  roomId: string;
  streamType: StreamType;
}

export interface LeaveResponseType extends SignalResponseType {
  fromUserId: string;
  streamType: StreamType;
}

export interface ScreenPayloadType {
  roomId: string;
}

export interface ScreenResponseType extends SignalResponseType {
  participants: ParticipantDataType[];
}
