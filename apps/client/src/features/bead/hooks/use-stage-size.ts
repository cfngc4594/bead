import { useLayoutEffect, useState } from "react";
import type { Viewport } from "@/features/bead/types";

export function useStageSize({
  containerRef,
  initialViewport,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  initialViewport: Viewport;
}) {
  const [stageSize, setStageSize] = useState(initialViewport);
  const [isStageMeasured, setIsStageMeasured] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateStageSize = ({
      height,
      width,
    }: {
      height: number;
      width: number;
    }) => {
      setStageSize({
        width: Math.max(1, width),
        height: Math.max(1, height),
      });
      setIsStageMeasured(true);
    };

    updateStageSize(container.getBoundingClientRect());

    const observer = new ResizeObserver(([entry]) => {
      updateStageSize(entry.contentRect);
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [containerRef]);

  return { isStageMeasured, stageSize };
}
