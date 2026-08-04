import { expect, test } from "bun:test";
import { listenForCanvasWheel } from "./use-canvas-wheel";

test("registers a non-passive wheel listener and prevents browser zoom", () => {
  let listener: EventListenerOrEventListenerObject | undefined;
  let listenerOptions: boolean | AddEventListenerOptions | undefined;
  let removedListener: EventListenerOrEventListenerObject | undefined;
  let removedOptions: boolean | EventListenerOptions | undefined;
  const element = {
    addEventListener(
      type: string,
      nextListener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) {
      expect(type).toBe("wheel");
      listener = nextListener;
      listenerOptions = options;
    },
    removeEventListener(
      type: string,
      nextListener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ) {
      expect(type).toBe("wheel");
      removedListener = nextListener;
      removedOptions = options;
    },
  } as unknown as HTMLElement;
  let defaultPrevented = false;
  let receivedEvent: WheelEvent | undefined;
  const event = {
    preventDefault() {
      defaultPrevented = true;
    },
  } as WheelEvent;

  const cleanup = listenForCanvasWheel(element, (nextEvent) => {
    receivedEvent = nextEvent;
  });

  expect(listenerOptions).toEqual({ capture: true, passive: false });
  expect(typeof listener).toBe("function");
  (listener as EventListener)(event);
  expect(defaultPrevented).toBe(true);
  expect(receivedEvent).toBe(event);

  cleanup();
  expect(removedListener).toBe(listener);
  expect(removedOptions).toEqual({ capture: true });
});
