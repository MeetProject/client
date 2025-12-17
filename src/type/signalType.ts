import { EmojiType } from '@/type/reactionType';
import { DeviceEnableType, TrackInfoType } from '@/type/streamType';

type ResponseType = 'REGISTER' | 'JOIN' | 'ANSWER' | 'OFFER' | 'ICE' | 'LEAVE' | 'SCREEN' | 'ERROR';
export type StreamType = 'USER' | 'SCREEN';

interface SignalResponseType {
	type: ResponseType;
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
	mediaOption: DeviceEnableType;
}

export interface JoinResponseType extends SignalResponseType {
	userId: string;
	roomId: string;
	participants: ParticipantResponseType[];
}

export interface OfferPayloadType {
	userId: string;
	sdp: string;
}

export interface OfferResponseType extends SignalResponseType {
	userId: string;
	roomId: string;
	sdp: string;
}

export interface AnswerPayloadType {
	userId: string;
	sdp: string;
}

export interface AnswerResponseType extends SignalResponseType {
	userId: string;
	sdp: string;
	roomId: string;
}

export interface IcePayloadType {
	userId: string;
	ice: string;
}

export interface IceResponseType extends SignalResponseType {
	userId: string;
	ice: string;
}

export interface TrackPayloadType {
	userId: string;
	transceiver: Record<string, TrackInfoType>;
}

export interface TrackResponseType extends SignalResponseType {
	userId: string;
	roomId: string;
	transceiver: Record<string, TrackInfoType>;
}

export interface LeaveResponseType extends SignalResponseType {
	userId: string;
}

export interface ScreenPayloadType {
	trackId: string;
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

export interface ParticipantResponseType extends TopicResponsType {
	userId: string;
	user: ParticipantDataType;
	mediaOption: DeviceEnableType;
}

export interface SignalEventType<T> {
	type: 'signal' | 'topic';
	path: string;
	payload: T;
}

export interface CreateSignalClientType {
	connect: () => void;
	disconnect: () => void;
	publish: <T>(type: 'signal' | 'topic', path: string, payload?: T) => void;
	signalSub: <T>(path: string, callback: (responset: T) => Promise<void> | void) => void;
	topicSub: <T>(destination: string, callback: (responset: T) => Promise<void> | void) => void;
}

/* export interface CreateSignalClientType {
	connect: () => void;
	disconnect: () => void;
	publish: <T>(destination: string, payload?: T) => void;
	signalSub: <T>(destination: string, callback: (responset: T) => Promise<void> | void) => void;
	subscribe: <T>(destination: string, callback: (responset: T) => Promise<void> | void) => StompSubscription | null;
	topicSub: <T>(destination: string, callback: (responset: T) => Promise<void> | void) => void;
}
 */
