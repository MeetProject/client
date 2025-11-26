type ResponseType = 'REGISTER' | 'JOIN' | 'ANSWER' | 'OFFER' | 'ICE' | 'LEAVE' | 'SCREEN' | 'ERROR';
export type StreamType = 'USER' | 'SCREEN';

interface SignalResponseType {
	type: ResponseType;
}

interface SdpResponseType extends SignalResponseType {
	fromUserId: string;
	fromUserSDP: string;
	mediaOption?: Record<'audio' | 'video', boolean> | null;
	streamType: 'SCREEN' | 'USER';
	isScreenSender: boolean;
}

export interface ParticipantDataType {
	userId: string;
	userName: string;
	profileColor: string;
	roomId: string;
}

export interface ParticipantResponseType extends ParticipantDataType {
	isHandUp: boolean;
}

export interface RegisterResponseType extends SignalResponseType {
	userId: string;
}

export interface JoinPayloadType {
	roomId: string;
}

export interface JoinResponseType extends SignalResponseType {
	roomId: string;
	participants: ParticipantResponseType[];
	screenId: string | null;
}

export interface SdpPayloadType {
	toUserId: string;
	fromUserSDP: string;
	mediaOption: Record<'audio' | 'video', boolean> | null;
	streamType: 'SCREEN' | 'USER';
}

export interface AnswerResponseType extends SdpResponseType {}

export interface OfferResponseType extends SdpResponseType {
	user: ParticipantResponseType;
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
	participants: string[];
}

export interface ErrorResponseType extends SignalResponseType {
	code: string;
	message: string;
}
