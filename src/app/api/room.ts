import { RoomCreateResponseType, RoomValidateResponseType } from '@/type/participantType';

const DOMAIN = 'http://localhost:8080';

export const createRoom = async () => {
	const response = await fetch(`${DOMAIN}/api/room/create`, { method: 'POST' });
	if (!response.ok) {
		throw new Error('방 생성 api 오류');
	}
	const data = (await response.json()) as RoomCreateResponseType;
	return data;
};

export const validateRoom = async (roomId: string) => {
	const response = await fetch(`${DOMAIN}/api/room/validate?roomId=${roomId}`, {
		cache: 'no-cache',
	});

	if (!response.ok) {
		throw new Error('방 id 검사 api 오류');
	}

	const data = (await response.json()) as RoomValidateResponseType;
	return data;
};
