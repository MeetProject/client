import { DeviceEnableType } from './streamType';

type TopicType = 'LEAVE' | 'CHAT' | 'EMOJI' | 'DEVICE' | 'HANDUP';

interface TopicResponsType {
	type: TopicType;
	id: string;
}

export interface ChatResponseType extends TopicResponsType {
	userId: string;
	message: string;
	timestamp: string;
}

export interface EmojiResponseType extends TopicResponsType {
	userId: string;
	emoji: EmojiType;
	timestamp: string;
}

export interface HandUpResponseType extends TopicResponsType {
	userId: string;
	value: boolean;
}

export interface ChatType extends ChatResponseType {
	userName: string;
	header?: boolean;
}

export interface DeviceResponseType extends TopicResponsType {
	userId: string;
	mediaOption: DeviceEnableType;
}

export type EmojiType =
	| 'CLAP'
	| 'CURIOUS'
	| 'HEART'
	| 'LAUGHTER'
	| 'PARTYPOPPER'
	| 'SAD'
	| 'SURPRISE'
	| 'THUMBDOWN'
	| 'THUMBUP';
