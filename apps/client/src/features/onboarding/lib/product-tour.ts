import {
  ACTIONS,
  EVENTS,
  type EventHandler,
  ORIGIN,
  STATUS,
  type Step,
} from "react-joyride";

export type ProductTourStep = {
  content: string;
  placement: Step["placement"];
  selector: string;
  title: string;
};

type ProductTourControllerOptions = {
  onComplete: () => void;
  onDismiss: (stepIndex: number) => void;
  onStepViewed?: (stepIndex: number) => void;
};

export type ProductTourController = {
  dismissCurrentStep: () => void;
  handleEvent: EventHandler;
  reset: () => void;
};

export function createProductTourController({
  onComplete,
  onDismiss,
  onStepViewed,
}: ProductTourControllerOptions): ProductTourController {
  let currentStep = 0;
  let dismissedStep: number | null = null;
  const viewedSteps = new Set<number>();

  return {
    dismissCurrentStep() {
      onDismiss(currentStep);
    },
    handleEvent(data, controls) {
      currentStep = data.index;

      if (data.type === EVENTS.TOOLTIP && !viewedSteps.has(data.index)) {
        viewedSteps.add(data.index);
        onStepViewed?.(data.index);
      }

      if (data.action === ACTIONS.SKIP) {
        dismissedStep = data.index;
      }

      if (
        data.type === EVENTS.STEP_AFTER &&
        data.action === ACTIONS.CLOSE &&
        data.origin === ORIGIN.KEYBOARD
      ) {
        dismissedStep = data.index;
        controls.skip();
        return;
      }

      if (data.type !== EVENTS.TOUR_END) {
        return;
      }

      if (data.status === STATUS.FINISHED) {
        onComplete();
      } else if (data.status === STATUS.SKIPPED) {
        onDismiss(dismissedStep ?? data.index);
      }
    },
    reset() {
      currentStep = 0;
      dismissedStep = null;
      viewedSteps.clear();
    },
  };
}
