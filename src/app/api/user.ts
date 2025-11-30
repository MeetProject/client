import { UserRegisterPayloadType, UserReisgerResponseType } from '@/type/participantType';

export const register = async (payload: UserRegisterPayloadType) => {
	const response = await fetch('http://localhost:8080/api/user/register', {
		body: JSON.stringify(payload),
		headers: {
			'Content-Type': 'application/json',
		},
		method: 'POST',
	});
	if (!response.ok) {
		throw new Error('회원 등록 실패');
	}

	const data = (await response.json()) as UserReisgerResponseType;
	return data;
};
