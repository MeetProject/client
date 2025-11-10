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
  fromUserSdp: RTCSessionDescriptionInit;
}

export interface SdpResponseType extends SignalResponseType {
  fromUserId: string;
  fromUserSdp: RTCSessionDescription;
}

export interface IcePayloadType {
  fromUserId: string;
  toUserId: string;
  fromCandidate: RTCIceCandidate;
}

export interface IceResponseType extends SignalResponseType {
  fromUserId: string;
  fromUserIce: RTCLocalIceCandidateInit;
}

export interface LeaveResponseType extends SignalResponseType {
  fromUserId: string;
}
