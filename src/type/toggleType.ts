export type ToggleType = 'caption' | 'emoji' | 'handsUp' | 'screen';
export type ToggleStatusType = Record<ToggleType, boolean | 'disable'>;

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
