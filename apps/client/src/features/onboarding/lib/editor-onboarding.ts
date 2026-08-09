export const editorOnboardingStorageKey = "bead:onboarding:editor:v1";

export type EditorOnboardingLayout = "desktop" | "mobile";
export type EditorOnboardingSource = "automatic" | "manual";

type EditorOnboardingEvent =
  | "onboarding_completed"
  | "onboarding_skipped"
  | "onboarding_started"
  | "onboarding_step_viewed";

type EditorOnboardingProperties = Record<
  string,
  boolean | null | number | string | undefined
>;

type EditorOnboardingStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

type EditorOnboardingControllerOptions = {
  autoStartDelayMs?: number;
  now?: () => number;
  onOpenChange: (open: boolean) => void;
  schedule: (callback: () => void, delayMs: number) => () => void;
  storage: EditorOnboardingStorage;
  track: (
    event: EditorOnboardingEvent,
    properties: EditorOnboardingProperties,
  ) => void;
};

export type EditorOnboardingController = {
  complete: () => void;
  dismiss: (stepIndex: number) => void;
  scheduleAutomaticStart: () => () => void;
  startManual: () => void;
  viewStep: (stepIndex: number, layout: EditorOnboardingLayout) => void;
};

export function createEditorOnboardingController({
  autoStartDelayMs = 500,
  now = Date.now,
  onOpenChange,
  schedule,
  storage,
  track,
}: EditorOnboardingControllerOptions): EditorOnboardingController {
  let cancelAutomaticStart: (() => void) | null = null;
  let source: EditorOnboardingSource = "automatic";
  let startedAt: number | null = null;
  let activeStep: {
    index: number;
    layout: EditorOnboardingLayout;
    startedAt: number;
  } | null = null;
  const trackedSteps = new Set<number>();

  function cancelPendingAutomaticStart() {
    cancelAutomaticStart?.();
    cancelAutomaticStart = null;
  }

  function start(nextSource: EditorOnboardingSource) {
    source = nextSource;
    startedAt = now();
    activeStep = null;
    trackedSteps.clear();
    onOpenChange(true);
    track("onboarding_started", { source });
  }

  function getDurationMs(startTime: number, endTime: number) {
    return Math.max(0, Math.round(endTime - startTime));
  }

  function trackActiveStep(endTime: number) {
    if (!activeStep || trackedSteps.has(activeStep.index)) {
      activeStep = null;
      return;
    }

    track("onboarding_step_viewed", {
      duration_ms: getDurationMs(activeStep.startedAt, endTime),
      layout: activeStep.layout,
      source,
      step: activeStep.index + 1,
    });
    trackedSteps.add(activeStep.index);
    activeStep = null;
  }

  function finish() {
    const endedAt = now();
    trackActiveStep(endedAt);
    const durationMs =
      startedAt === null ? 0 : getDurationMs(startedAt, endedAt);
    startedAt = null;
    return durationMs;
  }

  return {
    complete() {
      cancelPendingAutomaticStart();
      const durationMs = finish();
      saveEditorOnboardingCompletion(storage);
      onOpenChange(false);
      track("onboarding_completed", { duration_ms: durationMs, source });
    },
    dismiss(stepIndex) {
      cancelPendingAutomaticStart();
      const durationMs = finish();
      saveEditorOnboardingCompletion(storage);
      onOpenChange(false);
      track("onboarding_skipped", {
        duration_ms: durationMs,
        source,
        step: stepIndex + 1,
      });
    },
    scheduleAutomaticStart() {
      cancelPendingAutomaticStart();

      if (hasCompletedEditorOnboarding(storage)) {
        return () => undefined;
      }

      cancelAutomaticStart = schedule(() => {
        cancelAutomaticStart = null;
        start("automatic");
      }, autoStartDelayMs);

      return cancelPendingAutomaticStart;
    },
    startManual() {
      cancelPendingAutomaticStart();
      start("manual");
    },
    viewStep(stepIndex, layout) {
      if (startedAt === null || activeStep?.index === stepIndex) {
        return;
      }

      const viewedAt = now();
      trackActiveStep(viewedAt);

      if (!trackedSteps.has(stepIndex)) {
        activeStep = { index: stepIndex, layout, startedAt: viewedAt };
      }
    },
  };
}

export function hasCompletedEditorOnboarding(
  storage: Pick<EditorOnboardingStorage, "getItem">,
) {
  try {
    return storage.getItem(editorOnboardingStorageKey) === "1";
  } catch {
    return false;
  }
}

export function saveEditorOnboardingCompletion(
  storage: Pick<EditorOnboardingStorage, "setItem">,
) {
  try {
    storage.setItem(editorOnboardingStorageKey, "1");
  } catch {
    // The tour can still finish when storage is unavailable.
  }
}
