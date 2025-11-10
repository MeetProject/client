type ResponseType = 'REGISTER' | 'JOIN' | 'ANSWER' | 'OFFER' | 'ICE' | 'LEAVE';

export interface RegisterResponseType {
  type: ResponseType;
  userId: string;
}

export interface JoinType {
  userId: string;
  roomId: string;
}

export interface ParticipantsSignalType {
  userId: string;
  userName: string;
  profieColor: string;
}

export interface JoinResponseType {
  type: ResponseType;
  roomId: string;
  participants: ParticipantsSignalType[];
}

export interface SdpPayloadType {
  fromUserId: string;
  toUserId: string;
  fromUserSdp: RTCSessionDescriptionInit;
}

export interface SdpResponseType {
  type: ResponseType;
  fromUserId: string;
  fromUserSdp: RTCSessionDescription;
}

export interface IcePayloadType {
  fromUserId: string;
  toUserId: string;
  fromCandidate: RTCIceCandidate;
}
