type ResponseType = 'REGISTER' | 'JOIN' | 'ANSWER' | 'OFFER' | 'ICE' | 'LEAVE';

interface SignalResponseType {
  type: ResponseType;
}

export interface RegisterResponseType extends SignalResponseType {
  userId: string;
}

export interface JoinType {
  userId: string;
  roomId: string;
}

export interface ParticipantDataType {
  userId: string;
  userName: string;
  profieColor: string;
}

export interface JoinResponseType extends SignalResponseType {
  roomId: string;
  participants: ParticipantDataType[];
}

export interface SdpPayloadType {
  fromUserId: string;
  toUserId: string;
  fromUserSDP: string;
}

export interface SdpResponseType extends SignalResponseType {
  fromUserId: string;
  fromUserSDP: string;
}

export interface IcePayloadType {
  fromUserId: string;
  toUserId: string;
  fromCandidate: string;
}

export interface IceResponseType extends SignalResponseType {
  fromUserId: string;
  fromUserIce: RTCLocalIceCandidateInit;
}

export interface LeaveResponseType extends SignalResponseType {
  fromUserId: string;
}
