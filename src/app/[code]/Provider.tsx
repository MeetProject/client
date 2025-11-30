'use client';

import { useShallow } from 'zustand/react/shallow';

import { useUserInfoStore } from '@/store/UserInfoStore';

import Meetting from './Meeting';
import Setting from './Profile';

export default function Provider() {
	const { color, name } = useUserInfoStore(
		useShallow((state) => ({
			color: state.color,
			name: state.name,
		})),
	);

	return name && color ? <Meetting /> : <Setting />;
}
