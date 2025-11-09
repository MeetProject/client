export interface RegisterResponseType {
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

export type JoinResponseType = ParticipantsSignalType[] | null;
