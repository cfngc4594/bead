import { useEffect, useState } from "react";
import { isDrawTool } from "@/features/bead/lib/canvas-tool-definitions";
import type { CanvasTool } from "@/features/bead/types";

export function useEditorToolFlyout(tool: CanvasTool) {
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  useEffect(() => {
    if (!isDrawTool(tool)) {
      setFlyoutOpen(false);
    }
  }, [tool]);

  return { flyoutOpen, setFlyoutOpen };
}
