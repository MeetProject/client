import { Client, StompSubscription } from '@stomp/stompjs';
import { create } from 'zustand';

interface ClientStoreType {
  client: Client | null;
  isClientReady: boolean;
  subscriptions: Map<string, StompSubscription>;
  roomSubscriptions: Map<string, StompSubscription>;

  setClient: (value: Client | null) => void;
  setIsClientReady: (value: boolean | null) => void;
  addSubscriptions: (id: string, sub: StompSubscription) => void;
  removeSubscriptions: (id: string) => void;
  addRoomSubscriptions: (id: string, sub: StompSubscription) => void;
  removeRoomSubscriptions: (id: string) => void;
  clearSubscriptions: () => void;
  clearRoomSubscriptions: () => void;
}

export const useClientStore = create<ClientStoreType>((set, get) => ({
  client: null,
  isClientReady: null,
  subscriptions: new Map(),
  roomSubscriptions: new Map(),

  setClient: (value) => set(() => ({ client: value })),
  setIsClientReady: (value: boolean) => set({ isClientReady: value }),

  addSubscriptions: (id, sub) => {
    get().subscriptions.set(id, sub);
  },

  removeSubscriptions: (id) => {
    const sub = get().subscriptions.get(id);
    sub?.unsubscribe();
    get().subscriptions.delete(id);
  },

  addRoomSubscriptions: (id, sub) => {
    get().roomSubscriptions.set(id, sub);
  },

  removeRoomSubscriptions: (id) => {
    const sub = get().roomSubscriptions.get(id);
    sub?.unsubscribe();
    get().roomSubscriptions.delete(id);
  },

  clearSubscriptions: () => {
    get().subscriptions.forEach((sub) => sub.unsubscribe());
    get().subscriptions.clear();
  },

  clearRoomSubscriptions: () => {
    get().roomSubscriptions.forEach((sub) => sub.unsubscribe());
    get().roomSubscriptions.clear();
  },
}));
