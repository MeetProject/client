export interface UserListType {
	id: string;
	name: string;
	color: string;
	isMicOn: boolean;
	isVideoOn: boolean;
	stream: MediaStream | null;
}
