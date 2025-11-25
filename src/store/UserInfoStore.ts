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
  color: '',
  id: '',
  name: '',
  screenId: null,
  setColor: (value: string) => set(() => ({ color: value })),
  setId: (value: string) => set(() => ({ id: value })),
  setName: (value: string) => set(() => ({ name: value })),
  setScreenId: (value: string | null) => set(() => ({ screenId: value })),
}));
