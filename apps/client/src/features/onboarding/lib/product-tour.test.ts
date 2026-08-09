import { expect, mock, test } from "bun:test";
import {
  ACTIONS,
  type Controls,
  EVENTS,
  type EventData,
  LIFECYCLE,
  ORIGIN,
  STATUS,
} from "react-joyride";
import { createProductTourController } from "./product-tour";

test("Escape skips the tour and reports the current step", () => {
  const onComplete = mock();
  const onDismiss = mock();
  const skip = mock();
  const controller = createProductTourController({ onComplete, onDismiss });

  controller.handleEvent(
    createEvent({
      action: ACTIONS.CLOSE,
      index: 2,
      origin: ORIGIN.KEYBOARD,
      type: EVENTS.STEP_AFTER,
    }),
    createControls(skip),
  );

  expect(skip).toHaveBeenCalledTimes(1);
  expect(onDismiss).not.toHaveBeenCalled();

  controller.handleEvent(
    createEvent({
      action: ACTIONS.SKIP,
      index: 2,
      status: STATUS.SKIPPED,
      type: EVENTS.TOUR_END,
    }),
    createControls(skip),
  );

  expect(onDismiss).toHaveBeenCalledWith(2);
  expect(onComplete).not.toHaveBeenCalled();
});

test("native back dismisses the currently visible step", () => {
  const onDismiss = mock();
  const controller = createProductTourController({
    onComplete: mock(),
    onDismiss,
  });

  controller.handleEvent(
    createEvent({ index: 3, type: EVENTS.TOOLTIP }),
    createControls(mock()),
  );
  controller.dismissCurrentStep();

  expect(onDismiss).toHaveBeenCalledWith(3);
});

test("finishing the final step completes the tour", () => {
  const onComplete = mock();
  const onDismiss = mock();
  const controller = createProductTourController({ onComplete, onDismiss });

  controller.handleEvent(
    createEvent({
      action: ACTIONS.COMPLETE,
      index: 3,
      status: STATUS.FINISHED,
      type: EVENTS.TOUR_END,
    }),
    createControls(mock()),
  );

  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(onDismiss).not.toHaveBeenCalled();
});

test("reports each visible step once per tour", () => {
  const onStepViewed = mock();
  const controller = createProductTourController({
    onComplete: mock(),
    onDismiss: mock(),
    onStepViewed,
  });
  const controls = createControls(mock());

  controller.handleEvent(createEvent({ index: 0 }), controls);
  controller.handleEvent(createEvent({ index: 0 }), controls);
  controller.handleEvent(
    createEvent({ index: 1, type: EVENTS.STEP_BEFORE }),
    controls,
  );
  controller.handleEvent(createEvent({ index: 1 }), controls);
  controller.handleEvent(createEvent({ index: 0 }), controls);

  expect(onStepViewed).toHaveBeenCalledTimes(2);
  expect(onStepViewed.mock.calls).toEqual([[0], [1]]);

  controller.reset();
  controller.handleEvent(createEvent({ index: 0 }), controls);

  expect(onStepViewed).toHaveBeenCalledTimes(3);
});

function createEvent(overrides: Partial<EventData>): EventData {
  return {
    action: ACTIONS.UPDATE,
    controlled: false,
    error: null,
    index: 0,
    lifecycle: LIFECYCLE.TOOLTIP,
    origin: null,
    scroll: null,
    scrolling: false,
    size: 4,
    status: STATUS.RUNNING,
    step: {} as EventData["step"],
    type: EVENTS.TOOLTIP,
    waiting: false,
    ...overrides,
  };
}

function createControls(skip: Controls["skip"]): Controls {
  return { skip } as Controls;
}
