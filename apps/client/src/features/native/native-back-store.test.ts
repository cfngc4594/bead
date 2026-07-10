import { afterEach, expect, test } from "bun:test";
import {
  consumeNativeBack,
  registerNativeBackHandler,
} from "./native-back-store";

const unregisterHandlers: Array<() => void> = [];

afterEach(() => {
  for (const unregister of unregisterHandlers.splice(0).reverse()) {
    unregister();
  }
});

test("consumeNativeBack checks the newest handler first", () => {
  const calls: string[] = [];
  registerHandler(() => {
    calls.push("first");
    return true;
  });
  registerHandler(() => {
    calls.push("second");
    return true;
  });

  expect(consumeNativeBack()).toBe(true);
  expect(calls).toEqual(["second"]);
});

test("consumeNativeBack continues until a handler consumes the event", () => {
  const calls: string[] = [];
  const unregisterFirst = registerHandler(() => {
    calls.push("first");
    return true;
  });
  const unregisterSecond = registerHandler(() => {
    calls.push("second");
    return false;
  });

  expect(consumeNativeBack()).toBe(true);
  expect(calls).toEqual(["second", "first"]);

  unregisterSecond();
  unregisterFirst();
  expect(consumeNativeBack()).toBe(false);
});

function registerHandler(handler: () => boolean) {
  const unregister = registerNativeBackHandler(handler);
  unregisterHandlers.push(unregister);
  return unregister;
}
