import { useEffect, useRef } from "react";
import {
  type NativeBackHandler,
  registerNativeBackHandler,
} from "@/features/native/native-back-store";

export function useNativeBackHandler({
  enabled,
  handler,
}: {
  enabled: boolean;
  handler: NativeBackHandler;
}) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return registerNativeBackHandler(() => handlerRef.current());
  }, [enabled]);
}

export function useNativeBackDismiss({
  enabled,
  onDismiss,
}: {
  enabled: boolean;
  onDismiss: () => void;
}) {
  useNativeBackHandler({
    enabled,
    handler: () => {
      onDismiss();
      return true;
    },
  });
}
