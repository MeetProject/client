import { BASE_60_DIGIT } from '@/asset/constant/id';

export const getRandomId = (length = 3): string => {
	const value = BASE_60_DIGIT[Math.floor(Math.random() * 60)];
	if (length === 1) {
		return value;
	}
	return value + getRandomId(length - 1);
};

export const getBase60 = (value: number): string => {
	if (value < 60) {
		return BASE_60_DIGIT[value];
	}
	return getBase60(Math.floor(value / 60)) + BASE_60_DIGIT[value % 60];
};

export const getSessionId = () => {
	const time = new Date().getTime();
	const time60 = getBase60(time);
	const key = getRandomId(3);
	return `${key}-${time60}`;
};
