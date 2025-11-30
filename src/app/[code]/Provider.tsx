'use client';

import { useShallow } from 'zustand/react/shallow';

import Meetting from './Meeting';
import Setting from './Profile';

import { useUserInfoStore } from '@/store/UserInfoStore';

export default function Provider() {
	const { color, name } = useUserInfoStore(
		useShallow((state) => ({
			color: state.color,
			name: state.name,
		})),
	);

	return name && color ? <Meetting /> : <Setting />;
}
