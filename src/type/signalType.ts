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
