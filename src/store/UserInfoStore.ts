import { create } from 'zustand';

interface UserInfoStoreType {
  id: string;
  name: string;
  color: string;
  screenId: string | null;
  setId: (value: string) => void;
  setName: (value: string) => void;
  setColor: (value: string) => void;
  setScreenId: (value: string | null) => void;
}

export const useUserInfoStore = create<UserInfoStoreType>((set) => ({
  id: '',
  name: '',
  color: '',
  screenId: null,
  setId: (value: string) => set(() => ({ id: value })),
  setName: (value: string) => set(() => ({ name: value })),
  setColor: (value: string) => set(() => ({ color: value })),
  setScreenId: (value: string | null) => set(() => ({ screenId: value })),
}));
