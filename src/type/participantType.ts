export interface UserListType {
	id: string;
	name: string;
	color: string;
	isMicOn: boolean;
	isVideoOn: boolean;
	stream: MediaStream | null;
}

export interface UserRegisterPayloadType {
	userName: string;
	userColor: string;
}

export interface UserReisgerResponseType {
	userId: string;
}

export interface RoomValidateResponseType {
	value: boolean;
}

export interface RoomCreateResponseType {
	roomId: string;
}
