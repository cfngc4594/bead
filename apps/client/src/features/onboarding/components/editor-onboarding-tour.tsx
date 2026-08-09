import { useIsMobile } from "@bead/ui/hooks/use-mobile";
import { ProductTour } from "@/features/onboarding/components/product-tour";
import type { EditorOnboardingLayout } from "@/features/onboarding/lib/editor-onboarding";
import { getEditorOnboardingSteps } from "@/features/onboarding/lib/editor-onboarding-steps";

type EditorOnboardingTourProps = {
  onComplete: () => void;
  onDismiss: (stepIndex: number) => void;
  onStepViewed: (stepIndex: number, layout: EditorOnboardingLayout) => void;
  open: boolean;
};

export function EditorOnboardingTour({
  onComplete,
  onDismiss,
  onStepViewed,
  open,
}: EditorOnboardingTourProps) {
  const isMobile = useIsMobile();
  const layout = isMobile ? "mobile" : "desktop";

  return (
    <ProductTour
      focusRestoreSelector='[aria-label="新手引导"], [aria-label="更多工具"]'
      onComplete={onComplete}
      onDismiss={onDismiss}
      onStepViewed={(stepIndex) => onStepViewed(stepIndex, layout)}
      open={open}
      restartKey={layout}
      steps={getEditorOnboardingSteps(isMobile)}
    />
  );
}
