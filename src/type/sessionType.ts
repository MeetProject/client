import { EmojiType } from './toggleType';

export interface UserInfo {
	name: string;
	color: string;
	audio: boolean;
	video: boolean;
}

export interface ChatInfo {
	id: string;
	userName: string;
	userId: string;
	date: string;
	content: string;
	header?: boolean;
}

export interface EmojiInfo {
	id: string;
	userName: string;
	userId: string;
	date: Date;
	emojiType: EmojiType;
}

interface RecordingPropertiesType {
	frameRate: number;
	hasAudio: boolean;
	hasVideo: boolean;
	name: string;
	outputMode: string;
	recordingLayout: string;
	resolution: string;
	shmSize: number;
}

export interface CreateSessionDataType {
	allowTranscoding: boolean;
	broadcasting: boolean;
	connections: {
		content: [];
		numberOfElements: number;
	};
	createdAt: number;
	customSessionId: string;
	defaultRecordingProperties: RecordingPropertiesType;
	forcedVideoCodec: string;
	id: string;
	mediaMode: string;
	object: string;
	recording: boolean;
	recordingMode: string;
	sessionId: string;
}

export interface ConnectSessionType {
	activeAt: null;
	adaptativeBitrate: null;
	clientData: null;
	connectionId: string;
	createdAt: number;
	customIceServers: [];
	id: string;
	ip: null | string;
	kurentoOptions: null;
	location: null;
	networkCache: null;
	object: string;
	onlyPlayWithSubscribers: null;
	platform: null;
	publishers: null | string;
	record: boolean;
	role: string;
	rtspUri: null;
	serverData: string;
	sessionId: string;
	status: string;
	subscribers: null;
	token: string;
	type: 'WEBRTC';
}
