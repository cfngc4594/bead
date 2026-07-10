import { createStore } from "zustand/vanilla";

export type NativeBackHandler = () => boolean;

type NativeBackHandlerEntry = {
  handler: NativeBackHandler;
  id: number;
};

type NativeBackStore = {
  consumeNativeBack: () => boolean;
  handlers: NativeBackHandlerEntry[];
  nextHandlerId: number;
  registerNativeBackHandler: (handler: NativeBackHandler) => () => void;
};

const nativeBackStore = createStore<NativeBackStore>()((set, get) => ({
  handlers: [],
  nextHandlerId: 0,
  registerNativeBackHandler: (handler) => {
    const id = get().nextHandlerId;

    set((state) => ({
      handlers: [...state.handlers, { id, handler }],
      nextHandlerId: id + 1,
    }));

    return () => {
      set((state) => ({
        handlers: state.handlers.filter((entry) => entry.id !== id),
      }));
    };
  },
  consumeNativeBack: () => {
    const handlers = [...get().handlers].reverse();

    for (const { handler } of handlers) {
      if (handler()) {
        return true;
      }
    }

    return false;
  },
}));

export function consumeNativeBack() {
  return nativeBackStore.getState().consumeNativeBack();
}

export function registerNativeBackHandler(handler: NativeBackHandler) {
  return nativeBackStore.getState().registerNativeBackHandler(handler);
}
