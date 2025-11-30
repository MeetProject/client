import { StompSubscription } from '@stomp/stompjs';

import { EmojiType } from './reactionType';
import { DeviceEnableType } from './streamType';

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

export interface ScreenStopPayloadType {
	ownerId: string;
	roomId: string;
}

export interface ScreenResponseType extends SignalResponseType {
	participants: string[];
}

export interface ErrorResponseType extends SignalResponseType {
	code: string;
	message: string;
}

type TopicType = 'LEAVE' | 'CHAT' | 'EMOJI' | 'DEVICE' | 'HANDUP';

interface TopicResponsType {
	type: TopicType;
	id: string;
}

export interface ChatPayloadType {
	message: string;
	roomId: string;
}

export interface ChatResponseType extends TopicResponsType {
	userId: string;
	message: string;
	timestamp: string;
}

export interface EmojiPayloadType {
	roomId: string;
	emoji: EmojiType;
}

export interface EmojiResponseType extends TopicResponsType {
	userId: string;
	emoji: EmojiType;
	timestamp: string;
}

export interface handUpPayloadType {
	roomId: string;
	value: boolean;
}

export interface HandUpResponseType extends TopicResponsType {
	userId: string;
	value: boolean;
}

export interface DevicePayloadType {
	roomId: string;
	mediaOption: DeviceEnableType;
}

export interface DeviceResponseType extends TopicResponsType {
	userId: string;
	mediaOption: DeviceEnableType;
}

export interface CreateSignalClientType {
	connect: () => void;
	disconnect: () => void;
	publish: <T>(destination: string, payload: T) => void;
	signalSub: <T>(destination: string, callback: (responset: T) => Promise<void> | void) => void;
	subscribe: <T>(destination: string, callback: (responset: T) => Promise<void> | void) => StompSubscription | null;
	topicSub: <T>(destination: string, callback: (responset: T) => Promise<void> | void) => void;
}
