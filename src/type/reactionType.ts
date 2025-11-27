import { ChatResponseType } from './signalType';

export interface ChatType extends ChatResponseType {
	userName: string;
	header?: boolean;
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
