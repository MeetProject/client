import { create } from 'zustand';

interface ClientStoreType {
	client: WebSocket | null;
	isClientReady: boolean;
	subscriptions: Map<string, Set<(payload: any) => void | Promise<void>>>;
	roomSubscriptions: Map<string, Set<(payload: any) => void | Promise<void>>>;
	roomId: string | null;

	setClient: (value: WebSocket | null) => void;
	setIsClientReady: (value: boolean | null) => void;
	addSubscriptions: (id: string, callback: (payload: any) => Promise<void> | void) => void;
	removeSubscriptions: (id: string) => void;
	setRoomId: (id: string | null) => void;
	addRoomSubscriptions: (id: string, sub: (payload: any) => Promise<void> | void) => void;
	removeRoomSubscriptions: (id: string) => void;
	clearSubscriptions: () => void;
	clearRoomSubscriptions: () => void;
}

export const useClientStore = create<ClientStoreType>((set, get) => ({
	addRoomSubscriptions: (id, callback) =>
		set((state) => {
			const roomSubscriptions = new Map(state.roomSubscriptions);

			if (!roomSubscriptions.has(id)) {
				roomSubscriptions.set(id, new Set());
			}

			roomSubscriptions.get(id)!.add(callback);

			return { roomSubscriptions };
		}),
	addSubscriptions: (id: string, callback: (payload: any) => void) =>
		set((state) => {
			const subscriptions = new Map(state.subscriptions);

			if (!subscriptions.has(id)) {
				subscriptions.set(id, new Set());
			}

			subscriptions.get(id)!.add(callback);

			return { subscriptions };
		}),
	clearRoomSubscriptions: () => {
		get().roomSubscriptions.clear();
	},
	clearSubscriptions: () => {
		get().subscriptions.clear();
	},

	client: null,
	isClientReady: null,
	removeRoomSubscriptions: (id) => {
		get().subscriptions.delete(id);
	},

	removeSubscriptions: (id) => {
		get().subscriptions.delete(id);
	},

	roomId: null,

	roomSubscriptions: new Map(),

	setClient: (value) => set(() => ({ client: value })),

	setIsClientReady: (value: boolean) => set({ isClientReady: value }),

	setRoomId: (value: string | null) => set({ roomId: value }),

	subscriptions: new Map(),
}));
