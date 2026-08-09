import { describe, expect, mock, test } from "bun:test";
import {
  createEditorOnboardingController,
  editorOnboardingStorageKey,
  hasCompletedEditorOnboarding,
  saveEditorOnboardingCompletion,
} from "./editor-onboarding";

describe("editor onboarding controller", () => {
  test("automatically opens once for a first-time user and persists completion", () => {
    const harness = createHarness();

    const cancel = harness.controller.scheduleAutomaticStart();

    expect(harness.scheduledDelay).toBe(500);
    expect(harness.openChanges).toEqual([]);

    harness.runScheduledCallback();

    expect(harness.openChanges).toEqual([true]);
    expect(harness.trackedEvents).toEqual([
      ["onboarding_started", { source: "automatic" }],
    ]);

    harness.controller.viewStep(0, "desktop");
    harness.advanceTime(125);
    harness.controller.viewStep(1, "desktop");
    harness.advanceTime(75);
    harness.controller.complete();

    expect(harness.storageValue()).toBe("1");
    expect(harness.openChanges).toEqual([true, false]);
    expect(harness.trackedEvents).toEqual([
      ["onboarding_started", { source: "automatic" }],
      [
        "onboarding_step_viewed",
        {
          duration_ms: 125,
          layout: "desktop",
          source: "automatic",
          step: 1,
        },
      ],
      [
        "onboarding_step_viewed",
        {
          duration_ms: 75,
          layout: "desktop",
          source: "automatic",
          step: 2,
        },
      ],
      ["onboarding_completed", { duration_ms: 200, source: "automatic" }],
    ]);

    cancel();
  });

  test("does not automatically reopen after completion but allows manual replay", () => {
    const harness = createHarness("1");

    harness.controller.scheduleAutomaticStart();

    expect(harness.scheduledDelay).toBeNull();

    harness.controller.startManual();
    harness.controller.viewStep(2, "mobile");
    harness.advanceTime(40);
    harness.controller.dismiss(2);

    expect(harness.openChanges).toEqual([true, false]);
    expect(harness.trackedEvents).toEqual([
      ["onboarding_started", { source: "manual" }],
      [
        "onboarding_step_viewed",
        { duration_ms: 40, layout: "mobile", source: "manual", step: 3 },
      ],
      ["onboarding_skipped", { duration_ms: 40, source: "manual", step: 3 }],
    ]);
    expect(harness.storageValue()).toBe("1");
  });

  test("manual replay cancels a pending automatic start", () => {
    const harness = createHarness();

    harness.controller.scheduleAutomaticStart();
    harness.controller.startManual();
    harness.runScheduledCallback();

    expect(harness.cancelSchedule).toHaveBeenCalledTimes(1);
    expect(harness.openChanges).toEqual([true]);
    expect(harness.trackedEvents).toEqual([
      ["onboarding_started", { source: "manual" }],
    ]);
  });

  test("deduplicates repeated step events while preserving step duration", () => {
    const harness = createHarness();

    harness.controller.startManual();
    harness.controller.viewStep(0, "mobile");
    harness.advanceTime(20);
    harness.controller.viewStep(0, "mobile");
    harness.advanceTime(30);
    harness.controller.viewStep(1, "mobile");
    harness.advanceTime(10);
    harness.controller.viewStep(0, "mobile");
    harness.advanceTime(15);
    harness.controller.complete();

    expect(harness.trackedEvents).toEqual([
      ["onboarding_started", { source: "manual" }],
      [
        "onboarding_step_viewed",
        { duration_ms: 50, layout: "mobile", source: "manual", step: 1 },
      ],
      [
        "onboarding_step_viewed",
        { duration_ms: 10, layout: "mobile", source: "manual", step: 2 },
      ],
      ["onboarding_completed", { duration_ms: 75, source: "manual" }],
    ]);
  });

  test("clamps durations when an injected clock moves backwards", () => {
    const harness = createHarness();

    harness.controller.startManual();
    harness.controller.viewStep(0, "desktop");
    harness.advanceTime(-10);
    harness.controller.dismiss(0);

    expect(harness.trackedEvents).toEqual([
      ["onboarding_started", { source: "manual" }],
      [
        "onboarding_step_viewed",
        {
          duration_ms: 0,
          layout: "desktop",
          source: "manual",
          step: 1,
        },
      ],
      ["onboarding_skipped", { duration_ms: 0, source: "manual", step: 1 }],
    ]);
  });
});

describe("editor onboarding persistence", () => {
  test("treats unavailable storage as incomplete without blocking completion", () => {
    const unavailableStorage = {
      getItem: () => {
        throw new Error("unavailable");
      },
      setItem: () => {
        throw new Error("unavailable");
      },
    };

    expect(hasCompletedEditorOnboarding(unavailableStorage)).toBe(false);
    expect(() =>
      saveEditorOnboardingCompletion(unavailableStorage),
    ).not.toThrow();
  });
});

function createHarness(initialStorageValue?: string) {
  let currentTime = 0;
  let scheduledCallback: (() => void) | null = null;
  let scheduledDelay: number | null = null;
  let storageValue = initialStorageValue ?? null;
  let scheduleCancelled = false;
  const cancelSchedule = mock(() => {
    scheduleCancelled = true;
  });
  const openChanges: boolean[] = [];
  const trackedEvents: Array<
    [string, Record<string, boolean | null | number | string | undefined>]
  > = [];

  const controller = createEditorOnboardingController({
    now: () => currentTime,
    onOpenChange: (open) => openChanges.push(open),
    schedule: (callback, delayMs) => {
      scheduledCallback = callback;
      scheduledDelay = delayMs;
      return cancelSchedule;
    },
    storage: {
      getItem: (key) =>
        key === editorOnboardingStorageKey ? storageValue : null,
      setItem: (key, value) => {
        if (key === editorOnboardingStorageKey) {
          storageValue = value;
        }
      },
    },
    track: (event, properties) => trackedEvents.push([event, properties]),
  });

  return {
    advanceTime: (durationMs: number) => {
      currentTime += durationMs;
    },
    cancelSchedule,
    controller,
    openChanges,
    runScheduledCallback: () => {
      if (!scheduleCancelled) {
        scheduledCallback?.();
      }
    },
    get scheduledDelay() {
      return scheduledDelay;
    },
    storageValue: () => storageValue,
    trackedEvents,
  };
}
