import { Button } from "@bead/ui/components/button";
import { useEffect, useRef, useState } from "react";
import { Joyride, type TooltipRenderProps } from "react-joyride";
import { useNativeBackDismiss } from "@/features/native/use-native-back";
import {
  createProductTourController,
  type ProductTourController,
  type ProductTourStep,
} from "@/features/onboarding/lib/product-tour";

type ProductTourProps = {
  focusRestoreSelector?: string;
  onComplete: () => void;
  onDismiss: (stepIndex: number) => void;
  onStepViewed?: (stepIndex: number) => void;
  open: boolean;
  restartKey?: string;
  steps: readonly ProductTourStep[];
};

const progressBeads = [
  { color: "#FE8B4C", id: "canvas" },
  { color: "#7DC4F4", id: "tools" },
  { color: "#F8DB4F", id: "colors" },
  { color: "#88C46C", id: "toolbar" },
];

const canvasSelector = '[data-onboarding="editor-canvas"]';
const canvasAnchorSelector = '[data-product-tour-anchor="canvas"]';

export function ProductTour({
  focusRestoreSelector,
  onComplete,
  onDismiss,
  onStepViewed,
  open,
  restartKey,
  steps,
}: ProductTourProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const callbacksRef = useRef({ onComplete, onDismiss, onStepViewed });
  const controllerRef = useRef<ProductTourController | null>(null);

  callbacksRef.current = { onComplete, onDismiss, onStepViewed };

  if (!controllerRef.current) {
    controllerRef.current = createProductTourController({
      onComplete: () => callbacksRef.current.onComplete(),
      onDismiss: (stepIndex) => callbacksRef.current.onDismiss(stepIndex),
      onStepViewed: (stepIndex) =>
        callbacksRef.current.onStepViewed?.(stepIndex),
    });
  }

  const controller = controllerRef.current;

  useEffect(() => {
    if (open) {
      controller.reset();
    }
  }, [controller, open]);

  useTourAccessibility({ focusRestoreSelector, open });

  useNativeBackDismiss({
    enabled: open,
    onDismiss: controller.dismissCurrentStep,
  });

  return (
    <>
      <span
        aria-hidden="true"
        data-product-tour-anchor="canvas"
        style={{
          height: 1,
          left: "50%",
          pointerEvents: "none",
          position: "fixed",
          top: "50%",
          width: 1,
        }}
      />
      <Joyride
        continuous
        floatingOptions={{
          flipOptions: { padding: 16 },
          middleware: [
            {
              fn: ({ rects, x, y }) => {
                const viewportPadding = 16;
                const maximumX = Math.max(
                  viewportPadding,
                  window.innerWidth - rects.floating.width - viewportPadding,
                );
                const maximumY = Math.max(
                  viewportPadding,
                  window.innerHeight - rects.floating.height - viewportPadding,
                );

                return {
                  x: Math.min(Math.max(x, viewportPadding), maximumX),
                  y: Math.min(Math.max(y, viewportPadding), maximumY),
                };
              },
              name: "keep-tooltip-in-viewport",
            },
          ],
          shiftOptions: { padding: 16 },
          strategy: "fixed",
        }}
        locale={{
          back: "上一步",
          close: "关闭",
          last: "开始创作",
          next: "下一步",
          nextWithProgress: "下一步（{current}/{total}）",
          open: "打开新手引导",
          skip: "跳过",
        }}
        onEvent={controller.handleEvent}
        options={{
          blockTargetInteraction: true,
          buttons: ["back", "primary", "skip"],
          dismissKeyAction: "close",
          offset: 12,
          overlayClickAction: false,
          overlayColor: "rgb(0 0 0 / 0.62)",
          scrollDuration: prefersReducedMotion ? 0 : 200,
          skipBeacon: true,
          spotlightPadding: 6,
          spotlightRadius: 12,
          targetWaitTimeout: 2500,
          width:
            "min(360px, calc(100vw - 2rem - env(safe-area-inset-left) - env(safe-area-inset-right)))",
          zIndex: 100,
        }}
        key={restartKey}
        run={open}
        scrollToFirstStep
        steps={steps.map((step) => {
          const spotlightsCanvas = step.selector === canvasSelector;

          return {
            content: step.content,
            id: step.selector,
            placement: step.placement,
            spotlightTarget: spotlightsCanvas ? step.selector : undefined,
            target: spotlightsCanvas ? canvasAnchorSelector : step.selector,
            title: step.title,
          };
        })}
        tooltipComponent={BeadTourTooltip}
      />
    </>
  );
}

function BeadTourTooltip({
  backProps,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) {
  const descriptionId = `product-tour-description-${index}`;
  const titleId = `product-tour-title-${index}`;

  return (
    <div
      {...tooltipProps}
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="animate-in overflow-y-auto overscroll-contain rounded-xl border bg-card p-5 text-card-foreground shadow-2xl duration-200 fade-in zoom-in-95 motion-reduce:animate-none"
      data-joyride-step={index}
      role="dialog"
      style={{
        maxHeight:
          "calc(100dvh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
        width:
          "min(360px, calc(100vw - 2rem - env(safe-area-inset-left) - env(safe-area-inset-right)))",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-muted-foreground text-xs">新手引导</p>
          <h2 className="mt-1 font-semibold text-lg" id={titleId}>
            {step.title}
          </h2>
        </div>
        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
          {index + 1}/{size}
        </span>
      </div>

      <div
        className="mt-3 text-muted-foreground text-sm leading-6"
        id={descriptionId}
      >
        {step.content}
      </div>

      <div aria-hidden="true" className="mt-5 flex items-center gap-2">
        {progressBeads.slice(0, size).map((bead, progressIndex) => (
          <span
            className="grid size-3 place-items-center rounded-full transition-transform duration-200 motion-reduce:transition-none"
            key={bead.id}
            style={{
              backgroundColor: bead.color,
              opacity: progressIndex <= index ? 1 : 0.28,
              transform: progressIndex === index ? "scale(1.2)" : "scale(1)",
            }}
          >
            <span className="size-1 rounded-full bg-white/80" />
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Button
          aria-label={skipProps["aria-label"]}
          data-action={skipProps["data-action"]}
          onClick={skipProps.onClick}
          title={skipProps.title}
          type="button"
          variant="ghost"
        >
          跳过
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {index > 0 ? (
            <Button
              aria-label={backProps["aria-label"]}
              data-action={backProps["data-action"]}
              onClick={backProps.onClick}
              title={backProps.title}
              type="button"
              variant="outline"
            >
              上一步
            </Button>
          ) : null}
          <Button
            aria-label={primaryProps["aria-label"]}
            data-action={primaryProps["data-action"]}
            onClick={primaryProps.onClick}
            title={primaryProps.title}
            type="button"
          >
            {isLastStep ? "开始创作" : "下一步"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

function useTourAccessibility({
  focusRestoreSelector,
  open,
}: Pick<ProductTourProps, "focusRestoreSelector" | "open">) {
  const focusRestoreTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const applicationRoot = document.getElementById("root");
    const activeElement = document.activeElement;

    focusRestoreTargetRef.current =
      activeElement instanceof HTMLElement && activeElement !== document.body
        ? activeElement
        : findVisibleElement(focusRestoreSelector);

    if (!applicationRoot) {
      return;
    }

    const previousAriaHidden = applicationRoot.getAttribute("aria-hidden");
    const previousInert = applicationRoot.inert;

    applicationRoot.inert = true;
    applicationRoot.setAttribute("aria-hidden", "true");

    return () => {
      applicationRoot.inert = previousInert;

      if (previousAriaHidden === null) {
        applicationRoot.removeAttribute("aria-hidden");
      } else {
        applicationRoot.setAttribute("aria-hidden", previousAriaHidden);
      }

      const capturedTarget = focusRestoreTargetRef.current;
      const fallbackTarget = findVisibleElement(focusRestoreSelector);

      queueMicrotask(() => {
        const target = capturedTarget?.isConnected
          ? capturedTarget
          : fallbackTarget;
        target?.focus({ preventScroll: true });
      });
    };
  }, [focusRestoreSelector, open]);
}

function findVisibleElement(selector?: string) {
  if (!selector) {
    return null;
  }

  return (
    [...document.querySelectorAll<HTMLElement>(selector)].find(
      (element) => element.getClientRects().length > 0,
    ) ?? null
  );
}
