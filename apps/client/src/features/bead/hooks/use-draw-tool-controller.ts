import { useEffect, useState } from "react";
import {
  type BeadFillMode,
  type DrawInstrument,
  drawTriggerDefinition,
  getDrawTriggerDefinition,
  isBeadFillModeEnabled,
  isDrawTool,
  parseCanvasTool,
  resolveCanvasTool,
} from "@/features/bead/lib/canvas-tool-definitions";
import type { CanvasTool } from "@/features/bead/types";

export function useDrawToolController(
  tool: CanvasTool,
  onSelectTool: (tool: CanvasTool) => void,
) {
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const isDrawToolActive = isDrawTool(tool);
  const drawSelection = isDrawToolActive ? parseCanvasTool(tool) : null;
  const beadFillEnabled = drawSelection
    ? isBeadFillModeEnabled(drawSelection.instrument)
    : false;
  const drawTrigger = drawSelection
    ? getDrawTriggerDefinition(
        drawSelection.instrument,
        drawSelection.beadFillMode,
      )
    : drawTriggerDefinition;

  useEffect(() => {
    if (!isDrawToolActive) {
      setFlyoutOpen(false);
    }
  }, [isDrawToolActive]);

  function applyDrawSelection(
    instrument: DrawInstrument,
    fillMode: BeadFillMode = drawSelection?.beadFillMode ?? "normal",
  ) {
    onSelectTool(resolveCanvasTool(instrument, fillMode));
  }

  function activateDrawEntry() {
    if (!isDrawToolActive) {
      onSelectTool("paint");
      setFlyoutOpen(true);
      return;
    }

    setFlyoutOpen((open) => !open);
  }

  function selectMainTool(nextTool: CanvasTool) {
    setFlyoutOpen(false);
    onSelectTool(nextTool);
  }

  return {
    activateDrawEntry,
    applyDrawSelection,
    beadFillEnabled,
    drawSelection,
    drawTrigger,
    flyoutOpen,
    isDrawToolActive,
    selectMainTool,
  };
}

export type DrawToolController = ReturnType<typeof useDrawToolController>;
