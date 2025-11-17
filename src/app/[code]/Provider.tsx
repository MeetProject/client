'use client';

import { useShallow } from 'zustand/react/shallow';
import { useUserInfoStore } from '@/store/UserInfoStore';
import Meetting from './Meeting';
import Setting from './Profile';

export default function Provider() {
  const { name, color } = useUserInfoStore(
    useShallow((state) => ({
      name: state.name,
      color: state.color,
    })),
  );

  return name && color ? <Meetting /> : <Setting />;
}
