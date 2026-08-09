import { expect, test } from "bun:test";
import { getEditorOnboardingSteps } from "./editor-onboarding-steps";

test("desktop onboarding targets desktop controls with desktop placements", () => {
  const steps = getEditorOnboardingSteps(false);

  expect(steps.map((step) => step.selector)).toEqual([
    '[data-onboarding="editor-canvas"]',
    '[data-onboarding="editor-tools-desktop"]',
    '[data-onboarding="editor-colors-desktop"]',
    '[data-onboarding="editor-toolbar"]',
  ]);
  expect(steps.map((step) => step.placement)).toEqual([
    "bottom",
    "top",
    "left",
    "bottom",
  ]);
});

test("mobile onboarding targets mobile controls without side overflow", () => {
  const steps = getEditorOnboardingSteps(true);

  expect(steps.map((step) => step.selector)).toEqual([
    '[data-onboarding="editor-canvas"]',
    '[data-onboarding="editor-tools-mobile"]',
    '[data-onboarding="editor-colors-mobile"]',
    '[data-onboarding="editor-toolbar"]',
  ]);
  expect(steps.map((step) => step.placement)).toEqual([
    "bottom",
    "top",
    "top",
    "bottom",
  ]);
});
